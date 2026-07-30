from decimal import Decimal
from billing.models import Payment
from django.db import IntegrityError, transaction
from django.db.models import Q
from rest_framework.exceptions import ValidationError

from billing.models import Invoice, InvoiceItem
from common.services.id_generator import generate_business_id
from laboratory.models import PackagePrice, TestPrice
from laboratory.models import LaboratoryTest, Package
from visits.models import Visit
from common.services.activity import log_activity
from notifications.services import get_notification_service


class InvoiceService:

    @staticmethod
    def get_visit(*, visit_id):
        return Visit.objects.get(visit_id=visit_id)

    @staticmethod
    def get_invoice(*, invoice_id):
        return Invoice.objects.get(invoice_id=invoice_id)

    @staticmethod
    def get_invoice_for_download(*, invoice_id):
        return Invoice.objects.prefetch_related("items").get(invoice_id=invoice_id)

    @staticmethod
    def get_invoice_by_verification_token(*, token):
        return Invoice.objects.select_related("visit__patient").get(verification_token=token)

    @staticmethod
    def get_test(*, test_id):
        return LaboratoryTest.objects.get(test_id=test_id)

    @staticmethod
    def get_package(*, package_id):
        return Package.objects.get(package_id=package_id)

    @staticmethod
    def get_item(*, item_id):
        return InvoiceItem.objects.get(id=item_id)

    @staticmethod
    def list_invoices(*, filters):
        invoices = Invoice.objects.select_related("visit__patient").prefetch_related("items")
        if search := filters.get("search"):
            invoices = invoices.filter(
                Q(invoice_id__icontains=search)
                | Q(visit__patient__patient_id__icontains=search)
                | Q(visit__patient__full_name__icontains=search)
            )
        if patient_id := filters.get("patient_id"):
            invoices = invoices.filter(visit__patient__patient_id=patient_id)
        if status := filters.get("status"):
            invoices = invoices.filter(status=status)
        if created_from := filters.get("created_from"):
            invoices = invoices.filter(created_at__date__gte=created_from)
        if created_to := filters.get("created_to"):
            invoices = invoices.filter(created_at__date__lte=created_to)
        return invoices.order_by(filters["ordering"])

    @staticmethod
    def _ensure_editable(invoice):
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
        actor=None,
    ):
        visit = Visit.objects.select_for_update().get(pk=visit.pk)
        if Invoice.objects.filter(visit=visit).exists():
            raise ValueError("An invoice already exists for this visit.")
        try:
            invoice = Invoice.objects.create(
                invoice_id=generate_business_id(model=Invoice, field="invoice_id", prefix="INV"),
                visit=visit, payment_preference=payment_preference, notes=notes,
                subtotal=Decimal("0.00"), discount=Decimal("0.00"),
                total_amount=Decimal("0.00"), amount_paid=Decimal("0.00"), balance_due=Decimal("0.00"),
            )
        except IntegrityError as exc:
            raise ValueError("An invoice already exists for this visit.") from exc
        log_activity(actor=actor, action="billing_created", entity=invoice)
        return invoice

    @staticmethod
    @transaction.atomic
    def add_test(
        *,
        invoice,
        laboratory_test,
        quantity=1,
        actor=None,
    ):
        invoice = Invoice.objects.select_for_update().get(pk=invoice.pk)
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

        invoice = InvoiceService.calculate_totals(invoice)
        log_activity(actor=actor, action="billing_updated", entity=invoice, metadata={"operation": "add_test"})

        return invoice

    @staticmethod
    @transaction.atomic
    def add_package(
        *,
        invoice,
        package,
        quantity=1,
        actor=None,
    ):
        invoice = Invoice.objects.select_for_update().get(pk=invoice.pk)
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

        invoice = InvoiceService.calculate_totals(invoice)
        log_activity(actor=actor, action="billing_updated", entity=invoice, metadata={"operation": "add_package"})

        return invoice

    @staticmethod
    @transaction.atomic
    def remove_item(
        *,
        invoice_item,
        actor=None,
    ):
        invoice = Invoice.objects.select_for_update().get(pk=invoice_item.invoice_id)
        InvoiceService._ensure_editable(invoice)

        invoice_item.delete()

        invoice = InvoiceService.calculate_totals(invoice)
        log_activity(actor=actor, action="billing_updated", entity=invoice, metadata={"operation": "remove_item"})

        return invoice

    @staticmethod
    @transaction.atomic
    def calculate_totals(invoice):
        invoice = Invoice.objects.select_for_update().get(pk=invoice.pk)
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
        actor=None,
    ):
        invoice = Invoice.objects.select_for_update().get(pk=invoice.pk)
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
        invoice.save(update_fields=["discount"])

        invoice = InvoiceService.calculate_totals(invoice)
        log_activity(actor=actor, action="billing_updated", entity=invoice, metadata={"operation": "discount"})

        return invoice

    @staticmethod
    @transaction.atomic
    def finalize_invoice(*, invoice, actor=None):
        invoice = Invoice.objects.select_for_update().get(pk=invoice.pk)
        if invoice.status != Invoice.Status.DRAFT:
            raise ValidationError("Only draft invoices can be finalized.")
        if not invoice.items.exists():
            raise ValidationError("An invoice must have at least one item before finalization.")
        if invoice.total_amount <= Decimal("0.00"):
            raise ValidationError("An invoice total must be greater than zero before finalization.")

        invoice.status = Invoice.Status.UNPAID
        invoice.balance_due = invoice.total_amount
        invoice.save(update_fields=["status", "balance_due", "updated_at"])
        log_activity(actor=actor, action="invoice_finalized", entity=invoice)
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
    def get_payment(*, payment_id):
        return Payment.objects.get(payment_id=payment_id)

    @staticmethod
    @transaction.atomic
    def record_payment(
        *,
        invoice,
        amount,
        payment_method,
        transaction_reference="",
        remarks="",
        actor=None,
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

        if invoice.visit.patient.email:
            recipient = invoice.visit.patient.email
            patient_name = invoice.visit.patient.full_name
            transaction.on_commit(
                lambda: PaymentService._send_payment_notification(
                    recipient=recipient, patient_name=patient_name,
                    invoice_id=invoice.invoice_id, amount=payment.amount,
                )
            )
        log_activity(
            actor=actor,
            action="payment_completed",
            entity=payment,
            metadata={"invoice_id": invoice.invoice_id, "amount": str(payment.amount)},
        )

        return payment

    @staticmethod
    def _send_payment_notification(*, recipient, patient_name, invoice_id, amount):
        try:
            get_notification_service().payment_confirmation(
                recipient=recipient, patient_name=patient_name, invoice_id=invoice_id, amount=amount,
            )
        except Exception:
            return None

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
        actor=None,
    ):
        payment = Payment.objects.select_for_update().get(pk=payment.pk)
        if payment.status != Payment.Status.SUCCESS:
            raise ValidationError("Only successful payments can be refunded.")
        invoice = Invoice.objects.select_for_update().get(pk=payment.invoice_id)

        payment.status = Payment.Status.REFUNDED
        payment.save(update_fields=["status"])

        invoice.amount_paid -= payment.amount

        if invoice.amount_paid < Decimal("0.00"):
            invoice.amount_paid = Decimal("0.00")

        PaymentService.update_invoice_status(invoice)
        log_activity(
            actor=actor,
            action="payment_refunded",
            entity=payment,
            metadata={"invoice_id": invoice.invoice_id, "amount": str(payment.amount)},
        )

        return payment


from billing.models import InvoiceItem
