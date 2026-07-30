from decimal import Decimal

from rest_framework import serializers

from billing.models import Invoice, InvoiceItem, Payment


class CreateInvoiceSerializer(serializers.Serializer):
    payment_preference = serializers.ChoiceField(
        choices=Invoice.PaymentPreference.choices,
        default=Invoice.PaymentPreference.PAY_NOW,
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )


class AddTestSerializer(serializers.Serializer):
    test_id = serializers.CharField()


class AddPackageSerializer(serializers.Serializer):
    package_id = serializers.CharField()


class ApplyDiscountSerializer(serializers.Serializer):
    discount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.00"),
    )


class RecordPaymentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )

    payment_method = serializers.ChoiceField(
        choices=Payment.PaymentMethod.choices,
    )

    transaction_reference = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )

    remarks = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )


class InvoiceListQuerySerializer(serializers.Serializer):
    search = serializers.CharField(required=False, allow_blank=True)
    patient_id = serializers.CharField(max_length=20, required=False)
    status = serializers.ChoiceField(choices=Invoice.Status.choices, required=False)
    created_from = serializers.DateField(required=False)
    created_to = serializers.DateField(required=False)
    ordering = serializers.ChoiceField(
        choices=("created_at", "-created_at", "invoice_id", "-invoice_id"),
        required=False,
        default="-created_at",
    )

    def validate(self, attrs):
        if attrs.get("created_from") and attrs.get("created_to"):
            if attrs["created_from"] > attrs["created_to"]:
                raise serializers.ValidationError(
                    "created_from cannot be after created_to."
                )
        return attrs


class InvoiceItemSerializer(serializers.ModelSerializer):

    class Meta:
        model = InvoiceItem
        fields = (
            "id",
            "item_type",
            "item_id",
            "item_name",
            "quantity",
            "unit_price",
            "discount",
            "line_total",
        )


class InvoiceSerializer(serializers.ModelSerializer):

    items = InvoiceItemSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Invoice
        fields = (
            "invoice_id",
            "status",
            "payment_preference",
            "subtotal",
            "discount",
            "total_amount",
            "amount_paid",
            "balance_due",
            "notes",
            "items",
            "created_at",
            "updated_at",
        )


class PaymentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Payment
        fields = (
            "payment_id",
            "invoice",
            "amount",
            "payment_method",
            "status",
            "transaction_reference",
            "remarks",
            "paid_at",
        )
