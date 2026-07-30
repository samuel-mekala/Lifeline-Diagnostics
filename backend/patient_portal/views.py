"""
Patient Portal API Views
========================
All endpoints are for PATIENT role only (PatientSelfPermission).
Patients can view/manage only their own data.

Endpoints:
  GET  /api/portal/profile/              - Get own patient profile
  GET  /api/portal/addresses/            - List saved addresses
  POST /api/portal/addresses/            - Add a new address
  GET  /api/portal/appointments/         - List own appointments
  POST /api/portal/book/                 - Book a new appointment (home or lab)
  GET  /api/portal/invoices/             - List own invoices
  GET  /api/portal/reports/              - List own approved reports
  GET  /api/portal/catalog/tests/        - Browse test catalog
  GET  /api/portal/catalog/packages/     - Browse package catalog
"""

from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import PatientSelfPermission
from rest_framework.permissions import AllowAny
from patients.models import Patient, PatientAddress
from visits.models import Appointment, Visit
from billing.models import Invoice, InvoiceItem
from reports.models import Report
from laboratory.models import LaboratoryTest, Package, TestPrice, PackagePrice
from common.services.id_generator import generate_business_id
from notifications.services import get_notification_service

import datetime


def get_patient_for_user(user):
    """Get the Patient record linked to the logged-in user."""
    try:
        return Patient.objects.get(linked_user=user)
    except Patient.DoesNotExist:
        return None


# ─────────────────────────────────────────────
# PROFILE
# ─────────────────────────────────────────────

class PortalProfileAPIView(APIView):
    permission_classes = [PatientSelfPermission]

    def get(self, request):
        patient = get_patient_for_user(request.user)
        if not patient:
            return Response({"error": "Patient profile not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            "patient_id": patient.patient_id,
            "full_name": patient.full_name,
            "email": patient.email,
            "phone": patient.phone,
            "gender": patient.gender,
            "gender_display": patient.gender_display,
            "date_of_birth": patient.date_of_birth,
            "age": patient.age,
            "address": patient.address,
            "registered_on": patient.registered_on,
        })


# ─────────────────────────────────────────────
# ADDRESSES
# ─────────────────────────────────────────────

class PortalAddressListAPIView(APIView):
    permission_classes = [PatientSelfPermission]

    def get(self, request):
        patient = get_patient_for_user(request.user)
        if not patient:
            return Response([], status=status.HTTP_200_OK)
        addresses = PatientAddress.objects.filter(patient=patient)
        return Response([{
            "id": str(addr.id),
            "label": addr.label,
            "address": addr.address,
            "is_default": addr.is_default,
        } for addr in addresses])

    def post(self, request):
        patient = get_patient_for_user(request.user)
        if not patient:
            return Response({"error": "Patient profile not found."}, status=status.HTTP_404_NOT_FOUND)

        label = request.data.get("label", "Home").strip()
        address_text = request.data.get("address", "").strip()
        is_default = request.data.get("is_default", False)

        if not address_text:
            return Response({"error": "Address is required."}, status=status.HTTP_400_BAD_REQUEST)

        if is_default:
            PatientAddress.objects.filter(patient=patient, is_default=True).update(is_default=False)

        addr = PatientAddress.objects.create(
            patient=patient,
            label=label,
            address=address_text,
            is_default=bool(is_default),
        )
        return Response({
            "id": str(addr.id),
            "label": addr.label,
            "address": addr.address,
            "is_default": addr.is_default,
        }, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────
# APPOINTMENTS
# ─────────────────────────────────────────────

def format_appointment(apt):
    patient = apt.patient
    return {
        "id": str(apt.id),
        "patient_id": patient.patient_id,
        "patient_name": patient.full_name,
        "collection_type": apt.collection_type,
        "collection_type_display": apt.get_collection_type_display(),
        "scheduled_for": apt.scheduled_for,
        "status": apt.status,
        "payment_preference": apt.payment_preference,
        "payment_status": apt.payment_status,
        "address": apt.address.address if apt.address else None,
        "address_label": apt.address.label if apt.address else None,
        "assigned_to": apt.assigned_to.full_name if apt.assigned_to else None,
        "remarks": apt.remarks,
        "created_at": apt.created_at,
        "updated_at": apt.updated_at,
        # Invoice info if exists
        "invoice_id": None,
        "total_amount": None,
        "invoice_status": None,
    }


class PortalAppointmentListAPIView(APIView):
    permission_classes = [PatientSelfPermission]

    def get(self, request):
        patient = get_patient_for_user(request.user)
        if not patient:
            return Response([], status=status.HTTP_200_OK)

        appointments = Appointment.objects.filter(
            patient=patient
        ).select_related("patient", "address", "assigned_to", "visit__invoice").order_by("-created_at")

        result = []
        for apt in appointments:
            data = format_appointment(apt)
            # Attach invoice info via the linked visit
            try:
                if apt.visit and hasattr(apt.visit, 'invoice'):
                    inv = apt.visit.invoice
                    data["invoice_id"] = inv.invoice_id
                    data["total_amount"] = float(inv.total_amount)
                    data["invoice_status"] = inv.status
                    data["payment_status"] = inv.status
            except Exception:
                pass
            result.append(data)

        return Response(result)


class PortalBookAppointmentAPIView(APIView):
    permission_classes = [PatientSelfPermission]

    def post(self, request):
        patient = get_patient_for_user(request.user)
        if not patient:
            return Response({"error": "Patient profile not found. Please complete registration."}, status=status.HTTP_404_NOT_FOUND)

        collection_type = request.data.get("collection_type", "").upper()
        scheduled_for_str = request.data.get("scheduled_for", "")
        payment_preference = request.data.get("payment_preference", "PAY_LATER").upper()
        test_ids = request.data.get("test_ids", [])        # list of LaboratoryTest test_id strings
        package_ids = request.data.get("package_ids", [])  # list of Package package_id strings
        address_id = request.data.get("address_id", None)  # UUID of existing PatientAddress
        new_address_text = request.data.get("new_address", "").strip()
        new_address_label = request.data.get("new_address_label", "Home").strip()
        remarks = request.data.get("remarks", "")

        # Validation
        if collection_type not in ("HOME", "LAB"):
            return Response({"error": "collection_type must be 'HOME' or 'LAB'."}, status=status.HTTP_400_BAD_REQUEST)

        if not test_ids and not package_ids:
            return Response({"error": "Please select at least one test or package."}, status=status.HTTP_400_BAD_REQUEST)

        if not scheduled_for_str:
            return Response({"error": "scheduled_for is required (ISO datetime string)."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            scheduled_for = datetime.datetime.fromisoformat(scheduled_for_str)
            if timezone.is_naive(scheduled_for):
                scheduled_for = timezone.make_aware(scheduled_for)
        except (ValueError, TypeError):
            return Response({"error": "Invalid scheduled_for datetime format. Use ISO format: 2026-08-01T09:00:00"}, status=status.HTTP_400_BAD_REQUEST)

        if scheduled_for <= timezone.now():
            return Response({"error": "Appointment must be scheduled in the future."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # 1. Resolve address for HOME collection
                address_obj = None
                if collection_type == "HOME":
                    if address_id:
                        try:
                            address_obj = PatientAddress.objects.get(id=address_id, patient=patient)
                        except PatientAddress.DoesNotExist:
                            return Response({"error": "Address not found."}, status=status.HTTP_400_BAD_REQUEST)
                    elif new_address_text:
                        # Save new address
                        address_obj = PatientAddress.objects.create(
                            patient=patient,
                            label=new_address_label,
                            address=new_address_text,
                            is_default=False,
                        )
                    else:
                        return Response({"error": "Home collection requires an address. Provide address_id or new_address."}, status=status.HTTP_400_BAD_REQUEST)

                # 2. Resolve tests and packages
                tests = []
                for tid in test_ids:
                    try:
                        t = LaboratoryTest.objects.select_related("pricing").get(test_id=tid, is_active=True)
                        tests.append(t)
                    except LaboratoryTest.DoesNotExist:
                        return Response({"error": f"Test '{tid}' not found."}, status=status.HTTP_400_BAD_REQUEST)

                packages = []
                for pid in package_ids:
                    try:
                        p = Package.objects.select_related("pricing").get(package_id=pid, is_active=True)
                        packages.append(p)
                    except Package.DoesNotExist:
                        return Response({"error": f"Package '{pid}' not found."}, status=status.HTTP_400_BAD_REQUEST)

                # 3. Create Appointment
                appointment = Appointment.objects.create(
                    patient=patient,
                    collection_type=collection_type,
                    scheduled_for=scheduled_for,
                    address=address_obj,
                    payment_preference=payment_preference,
                    payment_status="UNPAID",
                    status=Appointment.Status.PENDING,
                    remarks=remarks,
                )

                # 4. Create Visit linked to appointment
                visit_id = generate_business_id(Visit, "visit_id", "VIS")
                visit = Visit.objects.create(
                    visit_id=visit_id,
                    patient=patient,
                    entry_mode=Visit.EntryMode.ONLINE,
                    status="REGISTERED",
                )
                appointment.visit = visit
                appointment.save(update_fields=["visit"])

                # 5. Calculate totals and create Invoice
                subtotal = 0
                invoice_items = []

                for t in tests:
                    try:
                        if collection_type == "HOME":
                            price = float(t.pricing.home_collection_price)
                        else:
                            price = float(t.pricing.walk_in_price)
                    except Exception:
                        price = 0
                    subtotal += price
                    invoice_items.append({
                        "item_type": "TEST",
                        "item_id": t.test_id,
                        "item_name": t.name,
                        "unit_price": price,
                        "line_total": price,
                    })

                for p in packages:
                    try:
                        if collection_type == "HOME":
                            price = float(p.pricing.home_collection_price)
                        else:
                            price = float(p.pricing.walk_in_price)
                    except Exception:
                        price = 0
                    subtotal += price
                    invoice_items.append({
                        "item_type": "PACKAGE",
                        "item_id": p.package_id,
                        "item_name": p.name,
                        "unit_price": price,
                        "line_total": price,
                    })

                is_paid_now = (payment_preference == "PAY_NOW")
                invoice_id = generate_business_id(Invoice, "invoice_id", "INV")
                invoice = Invoice.objects.create(
                    invoice_id=invoice_id,
                    visit=visit,
                    payment_preference=payment_preference,
                    subtotal=subtotal,
                    discount=0,
                    total_amount=subtotal,
                    amount_paid=subtotal if is_paid_now else 0,
                    balance_due=0 if is_paid_now else subtotal,
                    status=Invoice.Status.PAID if is_paid_now else Invoice.Status.UNPAID,
                )

                for item in invoice_items:
                    InvoiceItem.objects.create(
                        invoice=invoice,
                        item_type=item["item_type"],
                        item_id=item["item_id"],
                        item_name=item["item_name"],
                        quantity=1,
                        unit_price=item["unit_price"],
                        discount=0,
                        line_total=item["line_total"],
                    )

                # Update appointment payment_status if paid now
                if is_paid_now:
                    appointment.payment_status = "PAID"
                    appointment.save(update_fields=["payment_status"])

                # 6. Notify all staff
                try:
                    notification_service = get_notification_service()
                    notification_service.booking_confirmation(
                        recipient=patient.email,
                        patient_name=patient.full_name,
                        appointment=scheduled_for.strftime("%d-%b-%Y %I:%M %p"),
                    )
                except Exception:
                    pass  # Notifications are best-effort

            return Response({
                "success": True,
                "appointment_id": str(appointment.id),
                "visit_id": visit.visit_id,
                "invoice_id": invoice.invoice_id,
                "total_amount": float(invoice.total_amount),
                "payment_status": invoice.status,
                "scheduled_for": appointment.scheduled_for,
                "status": appointment.status,
                "message": "Appointment booked successfully!",
            }, status=status.HTTP_201_CREATED)

        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────
# INVOICES
# ─────────────────────────────────────────────

class PortalInvoiceListAPIView(APIView):
    permission_classes = [PatientSelfPermission]

    def get(self, request):
        patient = get_patient_for_user(request.user)
        if not patient:
            return Response([], status=status.HTTP_200_OK)

        invoices = Invoice.objects.filter(
            visit__patient=patient
        ).prefetch_related("items", "payments").order_by("-created_at")

        result = []
        for inv in invoices:
            result.append({
                "id": str(inv.id),
                "invoice_id": inv.invoice_id,
                "visit_id": inv.visit.visit_id,
                "status": inv.status,
                "payment_preference": inv.payment_preference,
                "subtotal": float(inv.subtotal),
                "discount": float(inv.discount),
                "total_amount": float(inv.total_amount),
                "amount_paid": float(inv.amount_paid),
                "balance_due": float(inv.balance_due),
                "created_at": inv.created_at,
                "items": [{
                    "item_name": i.item_name,
                    "item_type": i.item_type,
                    "quantity": i.quantity,
                    "unit_price": float(i.unit_price),
                    "line_total": float(i.line_total),
                } for i in inv.items.all()],
                "payments": [{
                    "payment_id": p.payment_id,
                    "amount": float(p.amount),
                    "method": p.payment_method,
                    "status": p.status,
                    "paid_at": p.paid_at,
                } for p in inv.payments.all()],
            })
        return Response(result)


# ─────────────────────────────────────────────
# REPORTS
# ─────────────────────────────────────────────

class PortalReportListAPIView(APIView):
    permission_classes = [PatientSelfPermission]

    def get(self, request):
        patient = get_patient_for_user(request.user)
        if not patient:
            return Response([], status=status.HTTP_200_OK)

        reports = Report.objects.filter(
            visit__patient=patient,
            status=Report.Status.APPROVED,
        ).select_related("visit", "verified_by").order_by("-generated_at")

        result = []
        for rep in reports:
            result.append({
                "id": str(rep.id),
                "report_id": rep.report_id,
                "visit_id": rep.visit.visit_id,
                "status": rep.status,
                "generated_at": rep.generated_at,
                "verified_by": rep.verified_by.full_name if rep.verified_by else None,
                "verification_token": str(rep.verification_token),
                "download_url": f"/reports/{rep.visit.visit_id}/download/",
            })
        return Response(result)


# ─────────────────────────────────────────────
# TEST & PACKAGE CATALOG (public read)
# ─────────────────────────────────────────────

class PortalTestCatalogAPIView(APIView):
    permission_classes = [PatientSelfPermission]

    def get(self, request):
        tests = LaboratoryTest.objects.filter(is_active=True).select_related("pricing").order_by("name")
        result = []
        for t in tests:
            price = None
            home_price = None
            try:
                price = float(t.pricing.walk_in_price)
                home_price = float(t.pricing.home_collection_price)
            except Exception:
                pass
            result.append({
                "test_id": t.test_id,
                "name": t.name,
                "category": t.category,
                "sample_type": t.sample_type,
                "walk_in_price": price,
                "home_collection_price": home_price,
            })
        return Response(result)


class PortalPackageCatalogAPIView(APIView):
    permission_classes = [PatientSelfPermission]

    def get(self, request):
        packages = Package.objects.filter(is_active=True).select_related("pricing").prefetch_related("package_tests__laboratory_test").order_by("name")
        result = []
        for p in packages:
            price = None
            home_price = None
            try:
                price = float(p.pricing.walk_in_price)
                home_price = float(p.pricing.home_collection_price)
            except Exception:
                pass
            tests_in_pkg = [pt.laboratory_test.name for pt in p.package_tests.all()]
            result.append({
                "package_id": p.package_id,
                "name": p.name,
                "description": p.description,
                "walk_in_price": price,
                "home_collection_price": home_price,
                "test_count": len(tests_in_pkg),
                "tests": tests_in_pkg,
            })
        return Response(result)
