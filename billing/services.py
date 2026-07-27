from decimal import Decimal
from billing.models import Payment
from django.db import transaction

from billing.models import Invoice
from common.services.id_generator import generate_business_id
from laboratory.models import PackagePrice, TestPrice


class InvoiceService:

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

        InvoiceItem.objects.create(
            invoice=invoice,
            item_type=InvoiceItem.ItemType.TEST,
            item_id=laboratory_test.test_id,
            item_name=laboratory_test.name,
            quantity=1,
            unit_price=unit_price,
            discount=Decimal("0.00"),
            line_total=unit_price,
        )

        InvoiceService.calculate_totals(invoice)

        return invoice

    @staticmethod
    @transaction.atomic
    def add_package(
        *,
        invoice,
        package,
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

        InvoiceItem.objects.create(
            invoice=invoice,
            item_type=InvoiceItem.ItemType.PACKAGE,
            item_id=package.package_id,
            item_name=package.name,
            quantity=1,
            unit_price=unit_price,
            discount=Decimal("0.00"),
            line_total=unit_price,
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

        invoice_item.delete()

        InvoiceService.calculate_totals(invoice)

        return invoice

    @staticmethod
    @transaction.atomic
    def calculate_totals(invoice):
        subtotal = sum(
            (
                item.line_total
                for item in invoice.items.all()
            ),
            Decimal("0.00"),
        )

        total_amount = subtotal - invoice.discount

        if total_amount < Decimal("0.00"):
            total_amount = Decimal("0.00")

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
        invoice.discount = discount

        InvoiceService.calculate_totals(invoice)

        return invoice

    @staticmethod
    @transaction.atomic
    def cancel_invoice(invoice):
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
