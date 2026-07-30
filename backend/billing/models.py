import uuid

from django.db import models

from visits.models import Visit
# Create your models here.

class Invoice(models.Model):

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        UNPAID = "UNPAID", "Unpaid"
        PARTIALLY_PAID = "PARTIALLY_PAID", "Partially Paid"
        PAID = "PAID", "Paid"
        CANCELLED = "CANCELLED", "Cancelled"
        REFUNDED = "REFUNDED", "Refunded"

    class PaymentPreference(models.TextChoices):
        PAY_NOW = "PAY_NOW", "Pay Now"
        PAY_LATER = "PAY_LATER", "Pay Later"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    invoice_id = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
    )

    verification_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    visit = models.OneToOneField(
        Visit,
        on_delete=models.PROTECT,
        related_name="invoice",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    payment_preference = models.CharField(
        max_length=20,
        choices=PaymentPreference.choices,
        default=PaymentPreference.PAY_NOW,
    )

    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    discount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    amount_paid = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    balance_due = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    notes = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Invoice"
        verbose_name_plural = "Invoices"
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(subtotal__gte=0)
                    & models.Q(discount__gte=0)
                    & models.Q(total_amount__gte=0)
                    & models.Q(amount_paid__gte=0)
                    & models.Q(balance_due__gte=0)
                ),
                name="invoice_amounts_non_negative",
            ),
        ]

    def __str__(self):
        return self.invoice_id

class InvoiceItem(models.Model):

    class ItemType(models.TextChoices):
        TEST = "TEST", "Test"
        PACKAGE = "PACKAGE", "Package"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name="items",
    )

    item_type = models.CharField(
        max_length=20,
        choices=ItemType.choices,
    )

    item_id = models.CharField(
        max_length=20,
    )

    item_name = models.CharField(
        max_length=150,
    )

    quantity = models.PositiveIntegerField(
        default=1,
    )

    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    discount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    line_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    class Meta:
        ordering = ["id"]
        verbose_name = "Invoice Item"
        verbose_name_plural = "Invoice Items"
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(quantity__gte=1)
                    & models.Q(unit_price__gte=0)
                    & models.Q(discount__gte=0)
                    & models.Q(line_total__gte=0)
                ),
                name="invoice_item_amounts_valid",
            ),
        ]

    def __str__(self):
        return f"{self.invoice.invoice_id} - {self.item_name}"

class Payment(models.Model):

    class PaymentMethod(models.TextChoices):
        CASH = "CASH", "Cash"
        UPI = "UPI", "UPI"
        CARD = "CARD", "Card"
        BANK_TRANSFER = "BANK_TRANSFER", "Bank Transfer"

    class Status(models.TextChoices):
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"
        REFUNDED = "REFUNDED", "Refunded"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    payment_id = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
    )

    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.PROTECT,
        related_name="payments",
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SUCCESS,
    )

    transaction_reference = models.CharField(
        max_length=100,
        blank=True,
    )

    remarks = models.TextField(
        blank=True,
    )

    paid_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-paid_at"]
        verbose_name = "Payment"
        verbose_name_plural = "Payments"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(amount__gt=0),
                name="payment_amount_positive",
            ),
        ]

    def __str__(self):
        return self.payment_id
