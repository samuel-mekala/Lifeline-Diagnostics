from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import BillingPermission
from billing.models import Invoice, InvoiceItem, Payment
from billing.serializers import (
    AddPackageSerializer,
    AddTestSerializer,
    ApplyDiscountSerializer,
    CreateInvoiceSerializer,
    InvoiceSerializer,
    PaymentSerializer,
    RecordPaymentSerializer,
)
from billing.services import InvoiceService, PaymentService
from laboratory.models import LaboratoryTest, Package
from visits.models import Visit


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
            visit = Visit.objects.get(visit_id=visit_id)
        except Visit.DoesNotExist:
            return Response(
                {"error": "Visit not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            invoice = InvoiceService.create_invoice(
                visit=visit,
                **serializer.validated_data,
            )
        except (ValueError, ValidationError) as exc:
            return service_error_response(exc)

        return Response(
            InvoiceSerializer(invoice).data,
            status=status.HTTP_201_CREATED,
        )


class AddTestAPIView(APIView):
    permission_classes = [BillingPermission]

    def post(self, request, invoice_id):
        serializer = AddTestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            invoice = Invoice.objects.get(invoice_id=invoice_id)
            laboratory_test = LaboratoryTest.objects.get(
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
            invoice = Invoice.objects.get(invoice_id=invoice_id)
            package = Package.objects.get(
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
            invoice_item = InvoiceItem.objects.get(id=item_id)
        except InvoiceItem.DoesNotExist:
            return Response(
                {"error": "Invoice item not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            invoice = InvoiceService.remove_item(invoice_item=invoice_item)
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
            invoice = Invoice.objects.get(invoice_id=invoice_id)
        except Invoice.DoesNotExist:
            return Response(
                {"error": "Invoice not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            invoice = InvoiceService.apply_discount(
                invoice=invoice,
                discount=serializer.validated_data["discount"],
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
            invoice = Invoice.objects.get(invoice_id=invoice_id)
        except Invoice.DoesNotExist:
            return Response(
                {"error": "Invoice not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            invoice = InvoiceService.finalize_invoice(invoice=invoice)
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
            invoice = Invoice.objects.get(invoice_id=invoice_id)
        except Invoice.DoesNotExist:
            return Response(
                {"error": "Invoice not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            payment = PaymentService.record_payment(
                invoice=invoice,
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
            payment = Payment.objects.get(payment_id=payment_id)
        except Payment.DoesNotExist:
            return Response(
                {"error": "Payment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            payment = PaymentService.refund_payment(payment=payment)
        except (ValueError, ValidationError) as exc:
            return service_error_response(exc)

        return Response(
            PaymentSerializer(payment).data,
            status=status.HTTP_200_OK,
        )
