from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import BillingPermission
from common.pagination import OptionalPageNumberPagination
from billing.models import Invoice, InvoiceItem, Payment
from billing.serializers import (
    AddPackageSerializer,
    AddTestSerializer,
    ApplyDiscountSerializer,
    CreateInvoiceSerializer,
    InvoiceSerializer,
    InvoiceListQuerySerializer,
    PaymentSerializer,
    RecordPaymentSerializer,
)
from billing.services import InvoiceService, PaymentService
from billing.pdf_generator import InvoicePDFGenerator
from laboratory.models import LaboratoryTest, Package
from visits.models import Visit
from django.http import HttpResponse


def service_error_response(exception):
    if isinstance(exception, ValidationError):
        detail = exception.detail
        if isinstance(detail, list):
            message = "; ".join(str(item) for item in detail)
        else:
            message = str(detail)
    else:
        message = str(exception)

    return Response(
        {"error": message},
        status=status.HTTP_400_BAD_REQUEST,
    )


class CreateInvoiceAPIView(APIView):
    permission_classes = [BillingPermission]

    def post(self, request, visit_id):
        serializer = CreateInvoiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            visit = InvoiceService.get_visit(visit_id=visit_id)
        except Visit.DoesNotExist:
            return Response(
                {"error": "Visit not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            invoice = InvoiceService.create_invoice(
                visit=visit,
                actor=request.user,
                **serializer.validated_data,
            )
        except (ValueError, ValidationError) as exc:
            return service_error_response(exc)

        return Response(
            InvoiceSerializer(invoice).data,
            status=status.HTTP_201_CREATED,
        )


class InvoiceListAPIView(APIView):
    permission_classes = [BillingPermission]

    def get(self, request):
        serializer = InvoiceListQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        invoices = InvoiceService.list_invoices(filters=serializer.validated_data)
        paginator = OptionalPageNumberPagination()
        page = paginator.paginate_queryset(invoices, request, view=self)
        if page is not None:
            return paginator.get_paginated_response(
                InvoiceSerializer(page, many=True).data
            )
        return Response(InvoiceSerializer(invoices, many=True).data)


class DownloadInvoiceAPIView(APIView):
    permission_classes = [BillingPermission]

    def get(self, request, invoice_id):
        try:
            invoice = InvoiceService.get_invoice_for_download(invoice_id=invoice_id)
        except Invoice.DoesNotExist:
            return Response({"error": "Invoice not found."}, status=status.HTTP_404_NOT_FOUND)
        verification_url = request.build_absolute_uri(f"/api/billing/verify/{invoice.verification_token}/")
        pdf = InvoicePDFGenerator.generate(invoice, verification_url)
        response = HttpResponse(pdf, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{invoice.invoice_id}.pdf"'
        return response


class VerifyInvoiceAPIView(APIView):
    permission_classes = []
    authentication_classes = []

    def get(self, request, token):
        try:
            invoice = InvoiceService.get_invoice_by_verification_token(token=token)
        except Invoice.DoesNotExist:
            return Response({"valid": False}, status=status.HTTP_404_NOT_FOUND)
        return Response({"valid": True, "invoice_id": invoice.invoice_id, "status": invoice.status, "patient": invoice.visit.patient.full_name, "issued_at": invoice.created_at})


class AddTestAPIView(APIView):
    permission_classes = [BillingPermission]

    def post(self, request, invoice_id):
        serializer = AddTestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            invoice = InvoiceService.get_invoice(invoice_id=invoice_id)
            laboratory_test = InvoiceService.get_test(
                test_id=serializer.validated_data["test_id"]
            )
        except Invoice.DoesNotExist:
            return Response(
                {"error": "Invoice not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except LaboratoryTest.DoesNotExist:
            return Response(
                {"error": "Test not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            invoice = InvoiceService.add_test(
                invoice=invoice,
                laboratory_test=laboratory_test,
                actor=request.user,
            )
        except (ValueError, ValidationError) as exc:
            return service_error_response(exc)

        return Response(
            InvoiceSerializer(invoice).data,
            status=status.HTTP_200_OK,
        )


class AddPackageAPIView(APIView):
    permission_classes = [BillingPermission]

    def post(self, request, invoice_id):
        serializer = AddPackageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            invoice = InvoiceService.get_invoice(invoice_id=invoice_id)
            package = InvoiceService.get_package(
                package_id=serializer.validated_data["package_id"]
            )
        except Invoice.DoesNotExist:
            return Response(
                {"error": "Invoice not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Package.DoesNotExist:
            return Response(
                {"error": "Package not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            invoice = InvoiceService.add_package(
                invoice=invoice,
                package=package,
                actor=request.user,
            )
        except (ValueError, ValidationError) as exc:
            return service_error_response(exc)

        return Response(
            InvoiceSerializer(invoice).data,
            status=status.HTTP_200_OK,
        )


class RemoveInvoiceItemAPIView(APIView):
    permission_classes = [BillingPermission]

    def delete(self, request, item_id):
        try:
            invoice_item = InvoiceService.get_item(item_id=item_id)
        except InvoiceItem.DoesNotExist:
            return Response(
                {"error": "Invoice item not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            invoice = InvoiceService.remove_item(invoice_item=invoice_item, actor=request.user)
        except (ValueError, ValidationError) as exc:
            return service_error_response(exc)

        return Response(
            InvoiceSerializer(invoice).data,
            status=status.HTTP_200_OK,
        )


class ApplyDiscountAPIView(APIView):
    permission_classes = [BillingPermission]

    def patch(self, request, invoice_id):
        serializer = ApplyDiscountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            invoice = InvoiceService.get_invoice(invoice_id=invoice_id)
        except Invoice.DoesNotExist:
            return Response(
                {"error": "Invoice not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            invoice = InvoiceService.apply_discount(
                invoice=invoice,
                discount=serializer.validated_data["discount"],
                actor=request.user,
            )
        except (ValueError, ValidationError) as exc:
            return service_error_response(exc)

        return Response(
            InvoiceSerializer(invoice).data,
            status=status.HTTP_200_OK,
        )


class FinalizeInvoiceAPIView(APIView):
    permission_classes = [BillingPermission]

    def post(self, request, invoice_id):
        try:
            invoice = InvoiceService.get_invoice(invoice_id=invoice_id)
        except Invoice.DoesNotExist:
            return Response(
                {"error": "Invoice not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            invoice = InvoiceService.finalize_invoice(invoice=invoice, actor=request.user)
        except (ValueError, ValidationError) as exc:
            return service_error_response(exc)

        return Response(
            InvoiceSerializer(invoice).data,
            status=status.HTTP_200_OK,
        )


class RecordPaymentAPIView(APIView):
    permission_classes = [BillingPermission]

    def post(self, request, invoice_id):
        serializer = RecordPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            invoice = InvoiceService.get_invoice(invoice_id=invoice_id)
        except Invoice.DoesNotExist:
            return Response(
                {"error": "Invoice not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            payment = PaymentService.record_payment(
                invoice=invoice,
                actor=request.user,
                **serializer.validated_data,
            )
        except (ValueError, ValidationError) as exc:
            return service_error_response(exc)

        return Response(
            PaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )


class RefundPaymentAPIView(APIView):
    permission_classes = [BillingPermission]

    def post(self, request, payment_id):
        try:
            payment = PaymentService.get_payment(payment_id=payment_id)
        except Payment.DoesNotExist:
            return Response(
                {"error": "Payment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            payment = PaymentService.refund_payment(payment=payment, actor=request.user)
        except (ValueError, ValidationError) as exc:
            return service_error_response(exc)

        return Response(
            PaymentSerializer(payment).data,
            status=status.HTTP_200_OK,
        )
