from decimal import Decimal
from billing.models import Payment
from django.db import transaction
from rest_framework.exceptions import ValidationError

from billing.models import Invoice, InvoiceItem
from common.services.id_generator import generate_business_id
from laboratory.models import PackagePrice, TestPrice


class InvoiceService:

    @staticmethod
    def _ensure_editable(invoice):
        print("DEBUG invoice:", invoice.invoice_id)
        print("DEBUG status:", invoice.status)
        if invoice.status != Invoice.Status.DRAFT:
            raise ValidationError(
                "Only draft invoices can have items or totals modified."
            )

    @staticmethod
    def _validate_invoice_item_values(*, quantity, unit_price, discount):
        if quantity <= 0:
            raise ValidationError("Invoice item quantity must be greater than zero.")
        if unit_price < Decimal("0.00"):
            raise ValidationError("Invoice item unit price cannot be negative.")
        if discount < Decimal("0.00"):
            raise ValidationError("Invoice item discount cannot be negative.")

        line_total = (unit_price * quantity) - discount
        if line_total < Decimal("0.00"):
            raise ValidationError("Invoice item total cannot be negative.")

        return line_total

    @staticmethod
    def _create_invoice_item(
        *,
        invoice,
        item_type,
        item_id,
        item_name,
        quantity,
        unit_price,
        discount=Decimal("0.00"),
    ):
        InvoiceService._ensure_editable(invoice)
        line_total = InvoiceService._validate_invoice_item_values(
            quantity=quantity,
            unit_price=unit_price,
            discount=discount,
        )

        return InvoiceItem.objects.create(
            invoice=invoice,
            item_type=item_type,
            item_id=item_id,
            item_name=item_name,
            quantity=quantity,
            unit_price=unit_price,
            discount=discount,
            line_total=line_total,
        )

    @staticmethod
    def _price_for_entry_mode(pricing, entry_mode):
        price_field_by_entry_mode = {
            "WALK_IN": "walk_in_price",
            "HOME_COLLECTION": "home_collection_price",
            "ONLINE": "home_collection_price",
            "DOCTOR_REFERRAL": "doctor_referral_price",
        }

        try:
            price_field = price_field_by_entry_mode[entry_mode]
        except KeyError as exc:
            raise ValueError(f"Unsupported visit entry mode: {entry_mode}") from exc

        return getattr(pricing, price_field)

    @staticmethod
    @transaction.atomic
    def create_invoice(
        *,
        visit,
        payment_preference=Invoice.PaymentPreference.PAY_NOW,
        notes="",
    ):
        if Invoice.objects.filter(visit=visit).exists():
            raise ValueError("An invoice already exists for this visit.")

        return Invoice.objects.create(
            invoice_id=generate_business_id(
                model=Invoice,
                field="invoice_id",
                prefix="INV",
            ),
            visit=visit,
            payment_preference=payment_preference,
            notes=notes,
            subtotal=Decimal("0.00"),
            discount=Decimal("0.00"),
            total_amount=Decimal("0.00"),
            amount_paid=Decimal("0.00"),
            balance_due=Decimal("0.00"),
        )

    @staticmethod
    @transaction.atomic
    def add_test(
        *,
        invoice,
        laboratory_test,
        quantity=1,
    ):
        visit = invoice.visit

        try:
            pricing = TestPrice.objects.get(laboratory_test=laboratory_test)
        except TestPrice.DoesNotExist as exc:
            raise ValueError(
                f"No price configured for {laboratory_test.name}."
            ) from exc

        unit_price = InvoiceService._price_for_entry_mode(
            pricing,
            visit.entry_mode,
        )

        InvoiceService._create_invoice_item(
            invoice=invoice,
            item_type=InvoiceItem.ItemType.TEST,
            item_id=laboratory_test.test_id,
            item_name=laboratory_test.name,
            quantity=quantity,
            unit_price=unit_price,
        )

        InvoiceService.calculate_totals(invoice)

        return invoice

    @staticmethod
    @transaction.atomic
    def add_package(
        *,
        invoice,
        package,
        quantity=1,
    ):
        visit = invoice.visit

        try:
            pricing = PackagePrice.objects.get(package=package)
        except PackagePrice.DoesNotExist as exc:
            raise ValueError(
                f"No price configured for package {package.name}."
            ) from exc

        unit_price = InvoiceService._price_for_entry_mode(
            pricing,
            visit.entry_mode,
        )

        InvoiceService._create_invoice_item(
            invoice=invoice,
            item_type=InvoiceItem.ItemType.PACKAGE,
            item_id=package.package_id,
            item_name=package.name,
            quantity=quantity,
            unit_price=unit_price,
        )

        InvoiceService.calculate_totals(invoice)

        return invoice

    @staticmethod
    @transaction.atomic
    def remove_item(
        *,
        invoice_item,
    ):
        invoice = invoice_item.invoice
        InvoiceService._ensure_editable(invoice)

        invoice_item.delete()

        InvoiceService.calculate_totals(invoice)

        return invoice

    @staticmethod
    @transaction.atomic
    def calculate_totals(invoice):
        InvoiceService._ensure_editable(invoice)

        subtotal = sum(
            (
                item.line_total
                for item in invoice.items.all()
            ),
            Decimal("0.00"),
        )

        if subtotal < Decimal("0.00"):
            raise ValidationError("Invoice subtotal cannot be negative.")
        if invoice.discount < Decimal("0.00"):
            raise ValidationError("Invoice discount cannot be negative.")

        total_amount = subtotal - invoice.discount
        if total_amount < Decimal("0.00"):
            raise ValidationError("Invoice total cannot be negative.")

        balance_due = total_amount - invoice.amount_paid

        if balance_due < Decimal("0.00"):
            balance_due = Decimal("0.00")

        invoice.subtotal = subtotal
        invoice.total_amount = total_amount
        invoice.balance_due = balance_due

        invoice.save(
            update_fields=[
                "subtotal",
                "total_amount",
                "balance_due",
            ]
        )

        return invoice

    @staticmethod
    @transaction.atomic
    def apply_discount(
        *,
        invoice,
        discount,
    ):
        InvoiceService._ensure_editable(invoice)

        if discount < Decimal("0.00"):
            raise ValidationError("Invoice discount cannot be negative.")

        subtotal = sum(
            (item.line_total for item in invoice.items.all()),
            Decimal("0.00"),
        )
        if discount > subtotal:
            raise ValidationError("Invoice discount cannot exceed the subtotal.")

        invoice.discount = discount

        InvoiceService.calculate_totals(invoice)

        return invoice

    @staticmethod
    @transaction.atomic
    def finalize_invoice(*, invoice):
        if invoice.status != Invoice.Status.DRAFT:
            raise ValidationError("Only draft invoices can be finalized.")
        if not invoice.items.exists():
            raise ValidationError("An invoice must have at least one item before finalization.")
        if invoice.total_amount <= Decimal("0.00"):
            raise ValidationError("An invoice total must be greater than zero before finalization.")

        invoice.status = Invoice.Status.UNPAID
        invoice.balance_due = invoice.total_amount
        invoice.save(update_fields=["status", "balance_due", "updated_at"])
        return invoice

    @staticmethod
    @transaction.atomic
    def cancel_invoice(invoice):
        InvoiceService._ensure_editable(invoice)
        invoice.status = Invoice.Status.CANCELLED

        invoice.save(
            update_fields=[
                "status",
            ]
        )

        return invoice

class PaymentService:

    @staticmethod
    @transaction.atomic
    def record_payment(
        *,
        invoice,
        amount,
        payment_method,
        transaction_reference="",
        remarks="",
    ):
        if not invoice or not invoice.pk:
            raise ValidationError("A valid invoice is required to record a payment.")

        invoice = Invoice.objects.select_for_update().get(pk=invoice.pk)

        if amount <= Decimal("0.00"):
            raise ValidationError("Payment amount must be greater than zero.")
        if invoice.status == Invoice.Status.DRAFT:
            raise ValidationError("Draft invoices cannot receive payments.")
        if invoice.status == Invoice.Status.PAID:
            raise ValidationError("Paid invoices cannot receive additional payments.")
        if invoice.status not in {
            Invoice.Status.UNPAID,
            Invoice.Status.PARTIALLY_PAID,
        }:
            raise ValidationError("Payments can only be recorded for finalized invoices.")
        if invoice.total_amount <= Decimal("0.00"):
            raise ValidationError("Payments require an invoice with a positive total.")
        if invoice.amount_paid + amount > invoice.total_amount:
            raise ValidationError("Payment amount exceeds the outstanding balance.")

        payment = Payment.objects.create(
            payment_id=generate_business_id(
                model=Payment,
                field="payment_id",
                prefix="PAY",
            ),
            invoice=invoice,
            amount=amount,
            payment_method=payment_method,
            status=Payment.Status.SUCCESS,
            transaction_reference=transaction_reference,
            remarks=remarks,
        )

        invoice.amount_paid += amount

        PaymentService.update_invoice_status(invoice)

        return payment

    @staticmethod
    @transaction.atomic
    def update_invoice_status(invoice):
        invoice.balance_due = invoice.total_amount - invoice.amount_paid

        if invoice.balance_due < Decimal("0.00"):
            invoice.balance_due = Decimal("0.00")

        if invoice.amount_paid == Decimal("0.00"):
            invoice.status = Invoice.Status.UNPAID

        elif invoice.amount_paid < invoice.total_amount:
            invoice.status = Invoice.Status.PARTIALLY_PAID

        else:
            invoice.status = Invoice.Status.PAID

        invoice.save(
            update_fields=[
                "amount_paid",
                "balance_due",
                "status",
            ]
        )

        return invoice

    @staticmethod
    @transaction.atomic
    def refund_payment(
        *,
        payment,
    ):
        if payment.status == Payment.Status.REFUNDED:
            return payment

        invoice = payment.invoice

        payment.status = Payment.Status.REFUNDED
        payment.save(update_fields=["status"])

        invoice.amount_paid -= payment.amount

        if invoice.amount_paid < Decimal("0.00"):
            invoice.amount_paid = Decimal("0.00")

        PaymentService.update_invoice_status(invoice)

        return payment


from billing.models import InvoiceItem
