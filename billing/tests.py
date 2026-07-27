from datetime import date
from decimal import Decimal

from django.test import TestCase
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from accounts.models import User
from billing.models import Invoice
from billing.services import InvoiceService, PaymentService
from laboratory.services import LaboratoryTestService
from laboratory.models import TestPrice
from patients.models import Patient
from visits.models import Visit


class BillingIntegrityServiceTests(TestCase):
    def setUp(self):
        patient = Patient.objects.create(
            patient_id="PAT-BILLING-1",
            full_name="Billing Patient",
            date_of_birth=date(1990, 1, 1),
            gender="M",
            phone="9666666666",
            address="Billing test address",
        )
        self.visit = Visit.objects.create(
            visit_id="VIS-BILLING-1",
            patient=patient,
        )
        self.laboratory_test = LaboratoryTestService.create_test(
            name="Billing Integrity Test",
            category="BIOCHEMISTRY",
            sample_type="BLOOD",
        )
        self.test_price = TestPrice.objects.create(
            laboratory_test=self.laboratory_test,
            walk_in_price=Decimal("100.00"),
        )
        self.billing_user = User.objects.create_user(
            email="billing@example.com",
            full_name="Billing User",
            password="strong-password-123",
            role=User.Role.RECEPTIONIST,
        )

    def create_draft_invoice_with_test(self):
        invoice = InvoiceService.create_invoice(visit=self.visit)
        InvoiceService.add_test(
            invoice=invoice,
            laboratory_test=self.laboratory_test,
        )
        return invoice

    def create_finalized_invoice(self):
        invoice = self.create_draft_invoice_with_test()
        return InvoiceService.finalize_invoice(invoice=invoice)

    def test_existing_visit_invoice_is_rejected_with_a_controlled_api_error(self):
        InvoiceService.create_invoice(visit=self.visit)
        client = APIClient()
        client.force_authenticate(user=self.billing_user)

        response = client.post(
            f"/api/billing/create/{self.visit.visit_id}/",
            {"payment_preference": "PAY_NOW"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data,
            {"error": "An invoice already exists for this visit."},
        )

    def test_partial_payment_updates_invoice_balance_and_status(self):
        invoice = self.create_finalized_invoice()

        payment = PaymentService.record_payment(
            invoice=invoice,
            amount=Decimal("40.00"),
            payment_method="CASH",
        )
        invoice.refresh_from_db()

        self.assertEqual(payment.amount, Decimal("40.00"))
        self.assertEqual(invoice.amount_paid, Decimal("40.00"))
        self.assertEqual(invoice.balance_due, Decimal("60.00"))
        self.assertEqual(invoice.status, Invoice.Status.PARTIALLY_PAID)

    def test_exact_payment_marks_invoice_paid(self):
        invoice = self.create_finalized_invoice()

        PaymentService.record_payment(
            invoice=invoice,
            amount=Decimal("100.00"),
            payment_method="UPI",
        )
        invoice.refresh_from_db()

        self.assertEqual(invoice.amount_paid, Decimal("100.00"))
        self.assertEqual(invoice.balance_due, Decimal("0.00"))
        self.assertEqual(invoice.status, Invoice.Status.PAID)

    def test_overpayment_is_rejected(self):
        invoice = self.create_finalized_invoice()

        with self.assertRaisesMessage(
            ValidationError,
            "Payment amount exceeds the outstanding balance.",
        ):
            PaymentService.record_payment(
                invoice=invoice,
                amount=Decimal("100.01"),
                payment_method="CASH",
            )

        invoice.refresh_from_db()
        self.assertEqual(invoice.amount_paid, Decimal("0.00"))

    def test_draft_invoice_cannot_receive_payments(self):
        invoice = self.create_draft_invoice_with_test()

        with self.assertRaisesMessage(
            ValidationError,
            "Draft invoices cannot receive payments.",
        ):
            PaymentService.record_payment(
                invoice=invoice,
                amount=Decimal("10.00"),
                payment_method="CASH",
            )

    def test_finalized_invoice_can_receive_payment(self):
        invoice = self.create_finalized_invoice()

        payment = PaymentService.record_payment(
            invoice=invoice,
            amount=Decimal("1.00"),
            payment_method="CASH",
        )

        self.assertEqual(payment.invoice, invoice)

    def test_paid_invoice_cannot_receive_additional_payment(self):
        invoice = self.create_finalized_invoice()
        PaymentService.record_payment(
            invoice=invoice,
            amount=Decimal("100.00"),
            payment_method="CASH",
        )

        with self.assertRaisesMessage(
            ValidationError,
            "Paid invoices cannot receive additional payments.",
        ):
            PaymentService.record_payment(
                invoice=invoice,
                amount=Decimal("1.00"),
                payment_method="CASH",
            )

    def test_zero_and_negative_payments_are_rejected(self):
        invoice = self.create_finalized_invoice()

        for amount in (Decimal("0.00"), Decimal("-1.00")):
            with self.subTest(amount=amount):
                with self.assertRaisesMessage(
                    ValidationError,
                    "Payment amount must be greater than zero.",
                ):
                    PaymentService.record_payment(
                        invoice=invoice,
                        amount=amount,
                        payment_method="CASH",
                    )

    def test_missing_invoice_is_rejected(self):
        with self.assertRaisesMessage(
            ValidationError,
            "A valid invoice is required to record a payment.",
        ):
            PaymentService.record_payment(
                invoice=None,
                amount=Decimal("1.00"),
                payment_method="CASH",
            )

    def test_invalid_quantities_and_prices_are_rejected(self):
        invoice = InvoiceService.create_invoice(visit=self.visit)

        with self.assertRaisesMessage(
            ValidationError,
            "Invoice item quantity must be greater than zero.",
        ):
            InvoiceService.add_test(
                invoice=invoice,
                laboratory_test=self.laboratory_test,
                quantity=0,
            )

        self.test_price.walk_in_price = Decimal("-1.00")
        self.test_price.save(update_fields=["walk_in_price"])
        with self.assertRaisesMessage(
            ValidationError,
            "Invoice item unit price cannot be negative.",
        ):
            InvoiceService.add_test(
                invoice=invoice,
                laboratory_test=self.laboratory_test,
            )

    def test_discounts_cannot_produce_negative_totals(self):
        invoice = self.create_draft_invoice_with_test()

        with self.assertRaisesMessage(
            ValidationError,
            "Invoice discount cannot exceed the subtotal.",
        ):
            InvoiceService.apply_discount(
                invoice=invoice,
                discount=Decimal("100.01"),
            )

        invoice.refresh_from_db()
        self.assertEqual(invoice.total_amount, Decimal("100.00"))

    def test_finalized_and_paid_invoices_cannot_be_modified(self):
        invoice = self.create_finalized_invoice()

        with self.assertRaisesMessage(
            ValidationError,
            "Only draft invoices can have items or totals modified.",
        ):
            InvoiceService.apply_discount(invoice=invoice, discount=Decimal("1.00"))

        PaymentService.record_payment(
            invoice=invoice,
            amount=Decimal("100.00"),
            payment_method="CASH",
        )
        with self.assertRaisesMessage(
            ValidationError,
            "Only draft invoices can have items or totals modified.",
        ):
            InvoiceService.add_test(
                invoice=invoice,
                laboratory_test=self.laboratory_test,
            )
