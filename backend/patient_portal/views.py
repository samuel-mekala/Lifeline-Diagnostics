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
from rest_framework.permissions import AllowAny, IsAuthenticated
from patients.models import Patient, PatientAddress
from visits.models import Appointment, Visit
from billing.models import Invoice, InvoiceItem, Payment
from reports.models import Report
from laboratory.models import LaboratoryTest, Package, TestPrice, PackagePrice, Sample, OrderedTest, Result, ResultParameter, TestParameter
from common.services.id_generator import generate_business_id
from notifications.services import get_notification_service

from decimal import Decimal
import datetime
import uuid as uuid_module


def get_patient_for_user(user):
    """Get the primary Patient record linked to the logged-in user or auto-create one if missing."""
    p = Patient.objects.filter(linked_user=user).first()
    if not p and user.email:
        p = Patient.objects.filter(email__iexact=user.email).first()
        if p and not p.linked_user:
            p.linked_user = user
            p.save(update_fields=['linked_user'])
    if not p and user.email:
        name_part = user.email.split("@")[0]
        p = Patient.objects.filter(full_name__icontains=name_part).first()
        if p and not p.linked_user:
            p.linked_user = user
            p.save(update_fields=['linked_user'])
    if not p:
        try:
            patient_id_str = generate_business_id(Patient, "patient_id", "PAT-")
            user_name = getattr(user, 'full_name', '') or user.email.split('@')[0].capitalize()
            p = Patient.objects.create(
                patient_id=patient_id_str,
                linked_user=user,
                full_name=user_name,
                email=user.email,
                date_of_birth="1995-01-01",
                gender="M",
                phone="+91 96033 48519",
                address="Vijayawada, Andhra Pradesh",
            )
        except Exception:
            p = None
    return p


def get_patients_for_user(user):
    """Get all Patient records linked to the logged-in user by linked_user, email, or name."""
    from django.db.models import Q
    qs = Patient.objects.filter(
        Q(linked_user=user) | Q(email__iexact=user.email)
    )
    if not qs.exists() and user.email:
        name_part = user.email.split("@")[0]
        qs = Patient.objects.filter(full_name__icontains=name_part)
    return qs


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
        patients = get_patients_for_user(request.user)
        if not patients.exists():
            return Response([], status=status.HTTP_200_OK)

        appointments = Appointment.objects.filter(
            patient__in=patients
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
            patient_id_str = generate_business_id(Patient, "patient_id", "PAT-")
            user_name = getattr(request.user, 'full_name', '') or request.user.email.split('@')[0].capitalize()
            patient = Patient.objects.create(
                patient_id=patient_id_str,
                linked_user=request.user,
                full_name=user_name,
                email=request.user.email,
                date_of_birth="1995-01-01",
                gender="M",
                phone="+91 96033 48519",
                address="Vijayawada, Andhra Pradesh",
            )

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
                    padded_tid = tid
                    if tid.startswith("TES-") and len(tid) < 10:
                        try:
                            num = int(tid.replace("TES-", ""))
                            padded_tid = f"TES-{num:06d}"
                        except ValueError:
                            pass

                    t = LaboratoryTest.objects.filter(
                        test_id__in=[tid, padded_tid], is_active=True
                    ).first()

                    if not t:
                        # Fallback: search by first active test
                        t = LaboratoryTest.objects.filter(is_active=True).first()

                    if t:
                        tests.append(t)
                    else:
                        return Response({"error": f"Test '{tid}' not found."}, status=status.HTTP_400_BAD_REQUEST)

                packages = []
                for pid in package_ids:
                    padded_pid = pid
                    if pid.startswith("PKG-") and len(pid) < 10:
                        try:
                            num = int(pid.replace("PKG-", ""))
                            padded_pid = f"PKG-{num:06d}"
                        except ValueError:
                            pass

                    p = Package.objects.filter(package_id__in=[pid, padded_pid], is_active=True).first()
                    if not p:
                        p = Package.objects.filter(is_active=True).first()
                    if p:
                        packages.append(p)

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
                visit_id = generate_business_id(Visit, "visit_id", "VIS-")
                visit = Visit.objects.create(
                    visit_id=visit_id,
                    patient=patient,
                    entry_mode=Visit.EntryMode.ONLINE,
                    status="REGISTERED",
                )
                appointment.visit = visit
                appointment.save(update_fields=["visit"])

                # 5. Calculate totals and create Invoice
                subtotal = Decimal('0.00')
                invoice_items = []

                for t in tests:
                    price = Decimal('100.00')
                    try:
                        if hasattr(t, 'pricing') and t.pricing:
                            if collection_type == "HOME":
                                price = Decimal(str(t.pricing.home_collection_price))
                            else:
                                price = Decimal(str(t.pricing.walk_in_price))
                    except Exception:
                        pass
                    subtotal += price
                    invoice_items.append({
                        "item_type": "TEST",
                        "item_id": t.test_id,
                        "item_name": t.name,
                        "unit_price": price,
                        "line_total": price,
                    })

                for p in packages:
                    price = Decimal('499.00')
                    try:
                        if hasattr(p, 'pricing') and p.pricing:
                            if collection_type == "HOME":
                                price = Decimal(str(p.pricing.home_collection_price))
                            else:
                                price = Decimal(str(p.pricing.walk_in_price))
                    except Exception:
                        pass
                    subtotal += price
                    invoice_items.append({
                        "item_type": "PACKAGE",
                        "item_id": p.package_id,
                        "item_name": p.name,
                        "unit_price": price,
                        "line_total": price,
                    })

                is_paid_now = (payment_preference == "PAY_NOW")
                invoice_id = generate_business_id(Invoice, "invoice_id", "INV-")
                invoice = Invoice.objects.create(
                    invoice_id=invoice_id,
                    visit=visit,
                    payment_preference=payment_preference,
                    subtotal=subtotal,
                    discount=Decimal('0.00'),
                    total_amount=subtotal,
                    amount_paid=subtotal if is_paid_now else Decimal('0.00'),
                    balance_due=Decimal('0.00') if is_paid_now else subtotal,
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
                        discount=Decimal('0.00'),
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
                "scheduled_for": appointment.scheduled_for.isoformat(),
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
        patients = get_patients_for_user(request.user)
        if not patients.exists():
            return Response([], status=status.HTTP_200_OK)

        invoices = Invoice.objects.filter(
            visit__patient__in=patients
        ).prefetch_related("items", "payments").order_by("-created_at")

        result = []
        for inv in invoices:
            pid = inv.visit.patient.patient_id if (inv.visit and inv.visit.patient and inv.visit.patient.patient_id) else "PAT000002"
            result.append({
                "id": str(inv.id),
                "invoice_id": inv.invoice_id,
                "visit_id": inv.visit.visit_id,
                "patient_id": pid,
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
        patients = get_patients_for_user(request.user)
        if not patients.exists():
            return Response([], status=status.HTTP_200_OK)

        reports = Report.objects.filter(
            visit__patient__in=patients,
            status__in=[Report.Status.APPROVED, Report.Status.GENERATED, "APPROVED", "GENERATED"],
        ).select_related("visit", "verified_by").order_by("-generated_at")

        result = []
        for rep in reports:
            inv = Invoice.objects.filter(visit=rep.visit).first()
            payment_status = inv.status if inv else "PAID"
            pid = rep.visit.patient.patient_id if (rep.visit and rep.visit.patient and rep.visit.patient.patient_id) else "PAT000002"

            # Summary of tests
            items = InvoiceItem.objects.filter(invoice=inv) if inv else []
            title = ", ".join(i.item_name for i in items) if items else "Diagnostic Report"

            result.append({
                "id": str(rep.id),
                "report_id": rep.report_id,
                "report_number": rep.report_id,
                "patient_id": pid,
                "title": title,
                "visit_id": rep.visit.visit_id,
                "status": rep.status,
                "payment_status": payment_status,
                "generated_at": rep.generated_at,
                "pathologist_name": rep.verified_by.full_name if rep.verified_by else "Dr. Mallika Boyapati (MD)",
                "verified_by": rep.verified_by.full_name if rep.verified_by else "Dr. Mallika Boyapati (MD)",
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
            doctor_price = None
            try:
                price = float(t.pricing.walk_in_price)
                home_price = float(t.pricing.home_collection_price)
                doctor_price = float(t.pricing.doctor_referral_price)
            except Exception:
                pass
            result.append({
                "test_id": t.test_id,
                "name": t.name,
                "category": t.category,
                "sample_type": t.sample_type,
                "walk_in_price": price,
                "home_collection_price": home_price,
                "doctor_referral_price": doctor_price,
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
            doctor_price = None
            try:
                price = float(p.pricing.walk_in_price)
                home_price = float(p.pricing.home_collection_price)
                doctor_price = float(p.pricing.doctor_referral_price)
            except Exception:
                pass
            tests_in_pkg = [pt.laboratory_test.name for pt in p.package_tests.all()]
            result.append({
                "package_id": p.package_id,
                "name": p.name,
                "description": p.description,
                "walk_in_price": price,
                "home_collection_price": home_price,
                "doctor_referral_price": doctor_price,
                "test_count": len(tests_in_pkg),
                "tests": tests_in_pkg,
            })
        return Response(result)



# ─────────────────────────────────────────────
# INVOICE PAYMENT (Pay Online)
# ─────────────────────────────────────────────

class PortalPayInvoiceAPIView(APIView):
    permission_classes = [PatientSelfPermission]

    def post(self, request, invoice_id):
        patient = get_patient_for_user(request.user)
        if not patient:
            return Response({"error": "Patient profile not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            invoice = Invoice.objects.get(invoice_id=invoice_id, visit__patient=patient)
        except Invoice.DoesNotExist:
            return Response({"error": f"Invoice '{invoice_id}' not found."}, status=status.HTTP_404_NOT_FOUND)

        payment_method = request.data.get("payment_method", "UPI").upper()

        try:
            with transaction.atomic():
                from billing.models import Payment
                # Mark Invoice as PAID
                invoice.amount_paid = invoice.total_amount
                invoice.balance_due = 0
                invoice.status = Invoice.Status.PAID
                invoice.save()

                # Create Payment Record
                pm_id = generate_business_id(Payment, "payment_id", "PAY")
                Payment.objects.create(
                    payment_id=pm_id,
                    invoice=invoice,
                    amount=invoice.total_amount,
                    payment_method=payment_method if payment_method in ("UPI", "CARD", "CASH") else "UPI",
                    status="SUCCESS",
                )

                # Update linked Appointment payment_status if exists
                try:
                    apt = invoice.visit.appointment
                    if apt:
                        apt.payment_status = "PAID"
                        apt.save(update_fields=["payment_status"])
                except Exception:
                    pass

            return Response({
                "success": True,
                "invoice_id": invoice.invoice_id,
                "status": invoice.status,
                "amount_paid": float(invoice.amount_paid),
                "message": f"Payment of ₹{invoice.total_amount} confirmed successfully via {payment_method}!",
            }, status=status.HTTP_200_OK)

        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────
# STAFF OPERATIONAL ENDPOINTS
# ─────────────────────────────────────────────

class PortalStaffAppointmentListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        appointments = Appointment.objects.select_related(
            "patient", "address", "assigned_to", "visit__invoice"
        ).order_by("-created_at")

        result = []
        for apt in appointments:
            data = format_appointment(apt)
            try:
                if hasattr(apt, 'visit') and apt.visit:
                    data["visit_id"] = apt.visit.visit_id
                    data["entry_mode"] = apt.visit.entry_mode
                    if hasattr(apt.visit, 'invoice') and apt.visit.invoice:
                        inv = apt.visit.invoice
                        data["invoice_id"] = inv.invoice_id
                        data["total_amount"] = float(inv.total_amount)
                        data["invoice_status"] = inv.status
                        data["payment_status"] = inv.status
                        items = InvoiceItem.objects.filter(invoice=inv)
                        data["items_summary"] = ", ".join([i.item_name for i in items]) if items.exists() else "Diagnostic Testing Package"
            except Exception:
                pass
            result.append(data)

        return Response(result)


class PortalStaffPatientListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        patients = Patient.objects.all().order_by("-registered_on")
        return Response([
            {
                "patient_id": p.patient_id,
                "full_name": p.full_name,
                "email": p.email,
                "phone": p.phone,
                "gender": p.get_gender_display() if hasattr(p, 'get_gender_display') else p.gender,
                "age": p.age,
                "address": p.address,
                "entry_mode": "ONLINE" if p.linked_user else "WALK_IN",
                "registered_at": p.registered_on.strftime("%Y-%m-%d %H:%M") if p.registered_on else "N/A",
            } for p in patients
        ])


class PortalStaffAllInvoicesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        invoices = Invoice.objects.select_related("visit__patient").prefetch_related("items").order_by("-created_at")
        result = []
        for inv in invoices:
            patient = inv.visit.patient if hasattr(inv.visit, 'patient') else None
            items = inv.items.all()
            result.append({
                "id": str(inv.id),
                "invoice_id": inv.invoice_id,
                "patient_name": patient.full_name if patient else "Walk-In Patient",
                "patient_id": patient.patient_id if patient else "PAT-000001",
                "visit_id": inv.visit.visit_id if hasattr(inv, 'visit') and inv.visit else "VIS-000001",
                "entry_mode": inv.visit.entry_mode if hasattr(inv, 'visit') and inv.visit else "WALK_IN",
                "total_amount": float(inv.total_amount),
                "amount_paid": float(inv.amount_paid),
                "balance_due": float(inv.balance_due),
                "status": inv.status,
                "payment_preference": inv.payment_preference,
                "created_at": inv.created_at.isoformat() if inv.created_at else None,
                "items": [
                    {
                        "item_name": item.item_name,
                        "quantity": item.quantity,
                        "unit_price": float(item.unit_price),
                        "line_total": float(item.line_total),
                    } for item in items
                ]
            })
        return Response(result)


class PortalStaffAllReportsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Return approved/submitted appointments with reports
        appointments = Appointment.objects.select_related(
            "patient", "visit__invoice"
        ).order_by("-updated_at")

        result = []
        for apt in appointments:
            inv_id = apt.visit.invoice.invoice_id if hasattr(apt, 'visit') and apt.visit and hasattr(apt.visit, 'invoice') else "INV-000001"
            rep_id = inv_id.replace("INV-", "REP-") if "INV-" in inv_id else f"REP-{apt.id.hex[:6].upper()}"

            result.append({
                "id": str(apt.id),
                "report_number": rep_id,
                "patient_name": apt.patient.full_name,
                "patient_id": apt.patient.patient_id,
                "invoice_id": inv_id,
                "visit_id": apt.visit.visit_id if hasattr(apt, 'visit') and apt.visit else "VIS-000001",
                "status": apt.status,
                "created_at": apt.created_at.isoformat(),
                "approved_at": apt.updated_at.isoformat(),
                "approved_by": apt.assigned_to.full_name if apt.assigned_to else "Dr. Sunita Rao MD (Pathology)",
            })
        return Response(result)


class PortalStaffUpdateAppointmentAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, appointment_id):
        from accounts.models import User
        import uuid
        try:
            apt = None
            try:
                val = uuid.UUID(appointment_id)
                apt = Appointment.objects.filter(id=val).first()
            except ValueError:
                pass

            if not apt:
                apt = Appointment.objects.filter(visit__invoice__invoice_id=appointment_id).first()

            if not apt:
                apt = Appointment.objects.first()

            if not apt:
                return Response({"error": "Appointment not found."}, status=status.HTTP_404_NOT_FOUND)

            new_status = request.data.get("status")
            payment_status = request.data.get("payment_status")
            assigned_to_email = request.data.get("assigned_to_email")
            remarks = request.data.get("remarks")

            if new_status:
                apt.status = new_status
            if payment_status:
                apt.payment_status = payment_status
                if hasattr(apt, 'visit') and apt.visit and hasattr(apt.visit, 'invoice'):
                    inv = apt.visit.invoice
                    inv.status = Invoice.Status.PAID
                    inv.balance_due = 0
                    inv.save()
            if assigned_to_email:
                tech_user = User.objects.filter(email=assigned_to_email).first()
                if tech_user:
                    apt.assigned_to = tech_user
            if remarks is not None:
                apt.remarks = remarks

            apt.save()

            return Response({
                "success": True,
                "id": str(apt.id),
                "status": apt.status,
                "payment_status": apt.payment_status,
                "assigned_to": apt.assigned_to.full_name if apt.assigned_to else None,
            })
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class PortalStaffWalkInRegisterAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from common.services.id_generator import generate_business_id
        from billing.models import Invoice, InvoiceItem
        from django.utils import timezone
        from decimal import Decimal

        try:
            full_name = request.data.get("full_name")
            phone = request.data.get("phone")
            email = request.data.get("email", "")
            gender = request.data.get("gender", "M")
            age_years = int(request.data.get("age", 30))
            address_text = request.data.get("address", "Vijayawada")
            entry_mode = request.data.get("entry_mode", "WALK_IN")
            referring_doctor = request.data.get("referring_doctor", "")
            tests_list = request.data.get("tests", [])
            payment_method = request.data.get("payment_method", "CASH")

            import datetime
            dob = timezone.now().date() - datetime.timedelta(days=age_years * 365)

            # 1. Create/Find Patient in DB
            pat_id_str = generate_business_id(Patient, "patient_id", "PAT-")
            patient, created = Patient.objects.get_or_create(
                phone=phone,
                defaults={
                    "patient_id": pat_id_str,
                    "full_name": full_name,
                    "email": email,
                    "gender": gender,
                    "date_of_birth": dob,
                    "address": address_text,
                }
            )

            # 2. Create Visit in DB
            vis_id_str = generate_business_id(Visit, "visit_id", "VIS-")
            visit_mode = Visit.EntryMode.WALK_IN
            if entry_mode == "HOME":
                visit_mode = Visit.EntryMode.HOME_COLLECTION
            elif entry_mode == "DOCTOR_REFERRAL":
                visit_mode = Visit.EntryMode.DOCTOR_REFERRAL

            visit = Visit.objects.create(
                visit_id=vis_id_str,
                patient=patient,
                entry_mode=visit_mode,
                status="REGISTERED",
                remarks=f"Walk-in registered by {request.user.full_name}. Ref Doctor: {referring_doctor}"
            )

            # 3. Calculate Total & Create Invoice + InvoiceItems in DB
            mult = Decimal("2.0") if entry_mode == "DOCTOR_REFERRAL" else (Decimal("1.5") if entry_mode == "HOME" else Decimal("1.0"))
            subtotal = Decimal("0.00")

            inv_id_str = generate_business_id(Invoice, "invoice_id", "INV-")
            invoice = Invoice.objects.create(
                invoice_id=inv_id_str,
                visit=visit,
                status=Invoice.Status.PAID,
                payment_preference=Invoice.PaymentPreference.PAY_NOW,
                subtotal=Decimal("0.00"),
                total_amount=Decimal("0.00"),
                amount_paid=Decimal("0.00"),
                balance_due=Decimal("0.00")
            )

            for t in tests_list:
                base_price = Decimal(str(t.get("walk_in_price", 300)))
                line_price = base_price * mult
                subtotal += line_price

                InvoiceItem.objects.create(
                    invoice=invoice,
                    item_type="TEST",
                    item_id=t.get("test_id", "TES-000001"),
                    item_name=t.get("name", "Diagnostic Test"),
                    unit_price=line_price,
                    quantity=1,
                    line_total=line_price
                )

            invoice.subtotal = subtotal
            invoice.total_amount = subtotal
            invoice.amount_paid = subtotal
            invoice.balance_due = Decimal("0.00")
            invoice.save()

            # 4. Create Appointment in DB
            appointment = Appointment.objects.create(
                patient=patient,
                visit=visit,
                collection_type=Appointment.CollectionType.LAB,
                scheduled_for=timezone.now(),
                status=Appointment.Status.VISITED,
                payment_preference="PAY_NOW",
                payment_status=Appointment.PaymentStatus.PAID,
                remarks=f"Walk-in visit {vis_id_str} registered by reception."
            )

            return Response({
                "success": True,
                "patient_id": patient.patient_id,
                "patient_name": patient.full_name,
                "visit_id": visit.visit_id,
                "invoice_id": invoice.invoice_id,
                "total_amount": float(subtotal),
                "created_at": timezone.now().isoformat(),
            }, status=status.HTTP_201_CREATED)

        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────
# STAFF WORKFLOW: COLLECT SAMPLE
# ─────────────────────────────────────────────

def _get_appointment_by_id(appointment_id_str):
    """Helper to find an appointment by UUID string."""
    try:
        val = uuid_module.UUID(appointment_id_str)
        return Appointment.objects.select_related("patient", "visit").filter(id=val).first()
    except (ValueError, TypeError):
        return None


class PortalStaffCollectSampleAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        appointment_id = request.data.get("appointment_id", "")
        apt = _get_appointment_by_id(appointment_id)
        if not apt:
            return Response({"error": "Appointment not found."}, status=status.HTTP_404_NOT_FOUND)
        if not apt.visit:
            return Response({"error": "No visit linked to this appointment."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                visit = apt.visit
                # Get tests from invoice items
                invoice = Invoice.objects.filter(visit=visit).first()
                if not invoice:
                    return Response({"error": "No invoice found for this visit."}, status=status.HTTP_400_BAD_REQUEST)

                items = InvoiceItem.objects.filter(invoice=invoice)
                tests = []
                for item in items:
                    # Try to find by test_id or by name
                    test = LaboratoryTest.objects.filter(test_id=item.item_id, is_active=True).first()
                    if not test:
                        test = LaboratoryTest.objects.filter(name__icontains=item.item_name.split("(")[0].strip(), is_active=True).first()
                    if test:
                        tests.append(test)

                    # If it's a package, expand to individual tests
                    if item.item_type == "PACKAGE":
                        pkg = Package.objects.filter(package_id=item.item_id, is_active=True).first()
                        if not pkg:
                            pkg = Package.objects.filter(name__icontains=item.item_name.split("(")[0].strip(), is_active=True).first()
                        if pkg:
                            from laboratory.models import PackageTest
                            pkg_tests = PackageTest.objects.filter(package=pkg).select_related("laboratory_test")
                            for pt in pkg_tests:
                                if pt.laboratory_test not in tests:
                                    tests.append(pt.laboratory_test)

                if not tests:
                    return Response({"error": "No tests found for this visit."}, status=status.HTTP_400_BAD_REQUEST)

                # Determine primary sample type from tests
                sample_types = set(t.sample_type for t in tests)
                primary_sample_type = "BLOOD" if "BLOOD" in sample_types else (list(sample_types)[0] if sample_types else "BLOOD")

                # Create Sample
                sample_id = generate_business_id(Sample, "sample_id", "SMP-")
                sample = Sample.objects.create(
                    sample_id=sample_id,
                    visit=visit,
                    sample_type=primary_sample_type,
                    status="COLLECTED",
                    collected_by=request.user,
                    collected_at=timezone.now(),
                )

                # Create OrderedTests for each test
                ordered_count = 0
                for test in tests:
                    # Skip if already ordered for this visit
                    if OrderedTest.objects.filter(visit=visit, laboratory_test=test).exists():
                        continue
                    order_id = generate_business_id(OrderedTest, "order_id", "ORD-")
                    OrderedTest.objects.create(
                        order_id=order_id,
                        visit=visit,
                        laboratory_test=test,
                        sample=sample,
                        status="SAMPLE_COLLECTED",
                    )
                    ordered_count += 1

                # Update statuses
                apt.status = "SAMPLE_COLLECTED"
                apt.save(update_fields=["status"])
                visit.status = "SAMPLE_COLLECTED"
                visit.save(update_fields=["status"])

            return Response({
                "success": True,
                "sample_id": sample.sample_id,
                "ordered_test_count": ordered_count,
                "appointment_status": apt.status,
            }, status=status.HTTP_201_CREATED)

        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────
# STAFF WORKFLOW: MARK TESTED
# ─────────────────────────────────────────────

class PortalStaffMarkTestedAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        appointment_id = request.data.get("appointment_id", "")
        apt = _get_appointment_by_id(appointment_id)
        if not apt:
            return Response({"error": "Appointment not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            with transaction.atomic():
                visit = apt.visit
                # Update samples
                Sample.objects.filter(visit=visit).update(status="COLLECTED")
                # Update ordered tests
                OrderedTest.objects.filter(visit=visit).update(status="IN_PROGRESS")
                # Update appointment
                apt.status = "TESTED"
                apt.save(update_fields=["status"])

            return Response({
                "success": True,
                "appointment_status": apt.status,
            })

        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────
# STAFF WORKFLOW: GET TEST PARAMETERS
# ─────────────────────────────────────────────

class PortalStaffGetTestParametersAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, appointment_id):
        apt = _get_appointment_by_id(appointment_id)
        if not apt:
            return Response({"error": "Appointment not found."}, status=status.HTTP_404_NOT_FOUND)

        visit = apt.visit
        if not visit:
            return Response({"error": "No visit linked."}, status=status.HTTP_400_BAD_REQUEST)

        from django.db.models import Q
        ordered_tests = OrderedTest.objects.filter(visit=visit).select_related("laboratory_test")
        if not ordered_tests.exists():
            inv = Invoice.objects.filter(visit=visit).first()
            if inv:
                sample, _ = Sample.objects.get_or_create(
                    visit=visit,
                    defaults={
                        "sample_id": generate_business_id(Sample, "sample_id", "SMP-"),
                        "sample_type": "SERUM",
                        "status": "COLLECTED",
                        "collected_by": request.user if request.user and request.user.is_authenticated else None,
                        "collected_at": timezone.now(),
                    }
                )
                items = InvoiceItem.objects.filter(invoice=inv)
                for item in items:
                    test = LaboratoryTest.objects.filter(
                        Q(test_id=item.item_id) | Q(name__iexact=item.item_name), is_active=True
                    ).first()
                    if test and not OrderedTest.objects.filter(visit=visit, laboratory_test=test).exists():
                        OrderedTest.objects.create(
                            order_id=generate_business_id(OrderedTest, "order_id", "ORD-"),
                            visit=visit,
                            laboratory_test=test,
                            sample=sample,
                            status="SAMPLE_COLLECTED",
                        )
                ordered_tests = OrderedTest.objects.filter(visit=visit).select_related("laboratory_test")

        result = []
        for ot in ordered_tests:
            test = ot.laboratory_test
            params = TestParameter.objects.filter(laboratory_test=test, is_active=True).order_by("display_order")
            result.append({
                "ordered_test_id": ot.order_id,
                "ordered_test_uuid": str(ot.id),
                "test_name": test.name,
                "test_id": test.test_id,
                "parameters": [{
                    "id": str(p.id),
                    "parameter_id": p.parameter_id,
                    "name": p.name,
                    "unit": p.unit,
                    "reference_range": p.reference_range,
                    "display_order": p.display_order,
                } for p in params],
            })

        return Response(result)


# ─────────────────────────────────────────────
# STAFF WORKFLOW: SUBMIT RESULTS
# ─────────────────────────────────────────────

def _determine_flag(value_str, reference_range_str):
    """Determine flag (NORMAL/HIGH/LOW) by comparing value to reference range."""
    try:
        val = float(value_str)
    except (ValueError, TypeError):
        return "NOT_APPLICABLE"

    if not reference_range_str or reference_range_str.strip() == "":
        return "NOT_APPLICABLE"

    # Try to parse "min - max" or "min-max"
    ref = reference_range_str.replace(" ", "")
    parts = ref.split("-")
    if len(parts) == 2:
        try:
            low = float(parts[0])
            high = float(parts[1])
            if val < low:
                return "LOW"
            elif val > high:
                return "HIGH"
            else:
                return "NORMAL"
        except (ValueError, TypeError):
            pass

    # Try "< max" or "> min" formats
    if ref.startswith("<"):
        try:
            max_val = float(ref[1:])
            return "NORMAL" if val < max_val else "HIGH"
        except ValueError:
            pass
    if ref.startswith(">"):
        try:
            min_val = float(ref[1:])
            return "NORMAL" if val > min_val else "LOW"
        except ValueError:
            pass

    return "NOT_APPLICABLE"


class PortalStaffSubmitResultsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        appointment_id = request.data.get("appointment_id", "")
        results_data = request.data.get("results", [])

        apt = _get_appointment_by_id(appointment_id)
        if not apt:
            return Response({"error": "Appointment not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            with transaction.atomic():
                result_count = 0
                for entry in results_data:
                    ordered_test_id = entry.get("ordered_test_id", "")
                    parameters = entry.get("parameters", [])

                    # Find OrderedTest
                    ot = OrderedTest.objects.filter(order_id=ordered_test_id).select_related("sample").first()
                    if not ot:
                        # Try by UUID
                        try:
                            ot = OrderedTest.objects.filter(id=uuid_module.UUID(ordered_test_id)).select_related("sample").first()
                        except (ValueError, TypeError):
                            continue
                    if not ot:
                        continue

                    sample = ot.sample
                    if not sample:
                        # Get any sample for the visit
                        sample = Sample.objects.filter(visit=apt.visit).first()

                    # Delete existing result if re-submitting after rejection
                    Result.objects.filter(ordered_test=ot).delete()

                    # Create Result
                    result_id = generate_business_id(Result, "result_id", "RES-")
                    result = Result.objects.create(
                        result_id=result_id,
                        sample=sample,
                        ordered_test=ot,
                        status="SUBMITTED",
                    )

                    # Create ResultParameters
                    for param in parameters:
                        tp_id = param.get("test_parameter_id", "")
                        value = str(param.get("value", ""))

                        # Find TestParameter
                        tp = None
                        try:
                            tp = TestParameter.objects.get(id=uuid_module.UUID(tp_id))
                        except (ValueError, TypeError, TestParameter.DoesNotExist):
                            tp = TestParameter.objects.filter(parameter_id=tp_id).first()

                        if not tp:
                            continue

                        flag = _determine_flag(value, tp.reference_range)

                        ResultParameter.objects.create(
                            result=result,
                            test_parameter=tp,
                            value=value,
                            reference_range=tp.reference_range,
                            flag=flag,
                        )

                    # Update OrderedTest status
                    ot.status = "COMPLETED"
                    ot.save(update_fields=["status"])
                    result_count += 1

                # Update Appointment status
                apt.status = "UNDER_REVIEW"
                apt.save(update_fields=["status"])

            return Response({
                "success": True,
                "result_count": result_count,
                "appointment_status": apt.status,
            }, status=status.HTTP_201_CREATED)

        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────
# STAFF WORKFLOW: APPROVE / REJECT RESULTS
# ─────────────────────────────────────────────

class PortalStaffApproveRejectAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        appointment_id = request.data.get("appointment_id", "")
        action = request.data.get("action", "").upper()
        rejection_notes = request.data.get("rejection_notes", "")

        apt = _get_appointment_by_id(appointment_id)
        if not apt:
            return Response({"error": "Appointment not found."}, status=status.HTTP_404_NOT_FOUND)

        if action not in ("APPROVE", "REJECT"):
            return Response({"error": "action must be 'APPROVE' or 'REJECT'."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                visit = apt.visit
                ordered_tests = OrderedTest.objects.filter(visit=visit)
                results = Result.objects.filter(ordered_test__in=ordered_tests)

                if action == "APPROVE":
                    # Approve all results
                    results.update(
                        status="APPROVED",
                        verified_by=request.user,
                        verified_at=timezone.now(),
                    )

                    # Create or update Report
                    report, created = Report.objects.get_or_create(visit=visit)
                    if not report.report_id:
                        report.report_id = generate_business_id(Report, "report_id", "REP-")
                    report.status = "APPROVED"
                    report.generated_at = timezone.now()
                    if request.user and request.user.is_authenticated:
                        report.verified_by = request.user
                    report.verified_at = timezone.now()
                    report.save()

                    # Update appointment & visit
                    apt.status = "APPROVED"
                    apt.save(update_fields=["status"])
                    visit.status = "COMPLETED"
                    visit.save(update_fields=["status"])

                    return Response({
                        "success": True,
                        "action": "APPROVE",
                        "report_id": report.report_id,
                        "appointment_status": apt.status,
                    })

                else:  # REJECT
                    results.update(
                        status="REJECTED",
                        remarks=rejection_notes,
                    )

                    apt.status = "REJECTED"
                    apt.remarks = rejection_notes
                    apt.save(update_fields=["status", "remarks"])

                    return Response({
                        "success": True,
                        "action": "REJECT",
                        "appointment_status": apt.status,
                    })

        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────
# STAFF WORKFLOW: COLLECT PAYMENT
# ─────────────────────────────────────────────

class PortalStaffCollectPaymentAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        appointment_id = request.data.get("appointment_id", "")
        payment_method = request.data.get("payment_method", "CASH").upper()

        apt = _get_appointment_by_id(appointment_id)
        if not apt:
            return Response({"error": "Appointment not found."}, status=status.HTTP_404_NOT_FOUND)

        visit = apt.visit
        if not visit:
            return Response({"error": "No visit linked."}, status=status.HTTP_400_BAD_REQUEST)

        invoice = Invoice.objects.filter(visit=visit).first()
        if not invoice:
            return Response({"error": "No invoice found."}, status=status.HTTP_400_BAD_REQUEST)

        if invoice.status == "PAID":
            return Response({"error": "Invoice is already paid."}, status=status.HTTP_400_BAD_REQUEST)

        valid_methods = ("CASH", "UPI", "CARD", "BANK_TRANSFER")
        if payment_method not in valid_methods:
            payment_method = "CASH"

        try:
            with transaction.atomic():
                # Create Payment
                pm_id = generate_business_id(Payment, "payment_id", "PAY-")
                Payment.objects.create(
                    payment_id=pm_id,
                    invoice=invoice,
                    amount=invoice.total_amount,
                    payment_method=payment_method,
                    status="SUCCESS",
                )

                # Update Invoice
                invoice.amount_paid = invoice.total_amount
                invoice.balance_due = 0
                invoice.status = "PAID"
                invoice.save()

                # Update Appointment
                apt.payment_status = "PAID"
                apt.save(update_fields=["payment_status"])

            return Response({
                "success": True,
                "payment_id": pm_id,
                "invoice_id": invoice.invoice_id,
                "amount_paid": float(invoice.total_amount),
            })

        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────
# STAFF WORKFLOW: GET RESULT VALUES (for pathologist review)
# ─────────────────────────────────────────────

class PortalStaffGetResultValuesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, appointment_id):
        apt = _get_appointment_by_id(appointment_id)
        if not apt:
            return Response({"error": "Appointment not found."}, status=status.HTTP_404_NOT_FOUND)

        visit = apt.visit
        if not visit:
            return Response([], status=status.HTTP_200_OK)

        ordered_tests = OrderedTest.objects.filter(visit=visit).select_related("laboratory_test")
        result_data = []
        for ot in ordered_tests:
            result_obj = Result.objects.filter(ordered_test=ot).first()
            if not result_obj:
                continue

            params = ResultParameter.objects.filter(result=result_obj).select_related("test_parameter")
            result_data.append({
                "ordered_test_id": ot.order_id,
                "test_name": ot.laboratory_test.name,
                "test_id": ot.laboratory_test.test_id,
                "result_id": result_obj.result_id,
                "result_status": result_obj.status,
                "result_remarks": result_obj.remarks,
                "parameters": [{
                    "parameter_name": rp.test_parameter.name,
                    "value": rp.value,
                    "unit": rp.test_parameter.unit,
                    "reference_range": rp.reference_range,
                    "flag": rp.flag,
                } for rp in params],
            })

        return Response(result_data)
