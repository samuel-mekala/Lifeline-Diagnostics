from datetime import date
from decimal import Decimal

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import User
from billing.models import Invoice, Payment
from laboratory.models import LaboratoryTest, Result, TestPrice
from laboratory.services import LaboratoryTestService, TestParameterService
from reports.models import Report


@override_settings(ALLOWED_HOSTS=["testserver", "localhost"])
class LaboratoryBusinessWorkflowTests(TestCase):
    """Verifies the complete patient-to-payment diagnostic workflow."""

    def setUp(self):
        self.client = APIClient()
        self.receptionist = User.objects.create_user(
            email="reception@example.com",
            full_name="Reception User",
            password="strong-password-123",
            role=User.Role.RECEPTIONIST,
        )
        self.lab_technician = User.objects.create_user(
            email="technician@example.com",
            full_name="Lab Technician",
            password="strong-password-123",
            role=User.Role.LAB_TECHNICIAN,
        )
        self.pathologist = User.objects.create_user(
            email="pathologist@example.com",
            full_name="Pathologist",
            password="strong-password-123",
            role=User.Role.PATHOLOGIST,
        )
        self.test = LaboratoryTestService.create_test(
            name="End-to-End Glucose",
            category="BIOCHEMISTRY",
            sample_type="BLOOD",
        )
        TestParameterService.create_parameter(
            laboratory_test=self.test,
            name="Glucose",
            unit="mg/dL",
            reference_range="70-99",
            display_order=1,
        )
        TestPrice.objects.create(
            laboratory_test=self.test,
            walk_in_price=Decimal("100.00"),
        )

    def authenticate_as(self, user):
        self.client.force_authenticate(user=user)

    def test_complete_patient_to_payment_workflow(self):
        self.authenticate_as(self.receptionist)
        patient_response = self.client.post(
            "/api/patients/create/",
            {
                "full_name": "Workflow Test Patient",
                "date_of_birth": date(1990, 1, 1).isoformat(),
                "gender": "M",
                "phone": "9876543210",
                "email": "workflow@example.com",
                "address": "Lifeline Test Address",
            },
            format="json",
        )
        self.assertEqual(patient_response.status_code, 201)
        patient_id = patient_response.data["patient_id"]

        visit_response = self.client.post(
            "/api/visits/create/",
            {
                "patient_id": patient_id,
                "entry_mode": "HOME_COLLECTION",
                "remarks": "End-to-end workflow visit",
            },
            format="json",
        )
        self.assertEqual(visit_response.status_code, 201)
        visit_id = visit_response.data["visit_id"]

        self.authenticate_as(self.lab_technician)
        sample_response = self.client.post(
            "/api/laboratory/samples/",
            {
                "visit_id": visit_id,
                "sample_type": "BLOOD",
                "remarks": "Fasting sample",
            },
            format="json",
        )
        self.assertEqual(sample_response.status_code, 201)
        sample_id = sample_response.data["sample_id"]

        ordered_test_response = self.client.post(
            "/api/laboratory/ordered-tests/",
            {
                "visit_id": visit_id,
                "test_id": self.test.test_id,
                "remarks": "Routine glucose test",
            },
            format="json",
        )
        self.assertEqual(ordered_test_response.status_code, 201)
        order_id = ordered_test_response.data["order_id"]

        assign_response = self.client.post(
            f"/api/laboratory/ordered-tests/{order_id}/assign-sample/",
            {"sample_id": sample_id},
            format="json",
        )
        self.assertEqual(assign_response.status_code, 200)
        self.assertEqual(assign_response.data["status"], "SAMPLE_COLLECTED")

        result_response = self.client.post(
            "/api/laboratory/results/",
            {"order_id": order_id},
            format="json",
        )
        self.assertEqual(result_response.status_code, 201)
        result_id = result_response.data["result_id"]
        parameter_id = result_response.data["parameters"][0]["parameter_id"]

        parameter_response = self.client.patch(
            f"/api/laboratory/results/{result_id}/parameters/",
            {
                "parameter_id": parameter_id,
                "value": "110",
                "remarks": "Slightly high fasting value",
            },
            format="json",
        )
        self.assertEqual(parameter_response.status_code, 200)
        self.assertEqual(parameter_response.data["flag"], "HIGH")

        submit_response = self.client.post(
            f"/api/laboratory/results/{result_id}/submit/",
            {"remarks": "Ready for pathologist review"},
            format="json",
        )
        self.assertEqual(submit_response.status_code, 200)
        self.assertEqual(submit_response.data["status"], "PENDING_APPROVAL")

        self.authenticate_as(self.pathologist)
        approve_response = self.client.post(
            f"/api/laboratory/results/{result_id}/approve/",
            {"remarks": "Approved"},
            format="json",
        )
        self.assertEqual(approve_response.status_code, 200)
        self.assertEqual(approve_response.data["status"], "APPROVED")
        self.assertEqual(
            Result.objects.get(result_id=result_id).verified_by,
            self.pathologist,
        )

        report_response = self.client.get(
            f"/reports/{visit_response.data['visit_id']}/download/"
        )
        self.assertEqual(report_response.status_code, 200)
        self.assertEqual(report_response["Content-Type"], "application/pdf")
        self.assertTrue(report_response.content.startswith(b"%PDF"))
        self.assertTrue(Report.objects.filter(visit__visit_id=visit_id).exists())

        self.authenticate_as(self.receptionist)
        invoice_response = self.client.post(
            f"/api/billing/create/{visit_id}/",
            {"payment_preference": "PAY_NOW"},
            format="json",
        )
        self.assertEqual(invoice_response.status_code, 201)
        invoice_id = invoice_response.data["invoice_id"]

        add_test_response = self.client.post(
            f"/api/billing/add-test/{invoice_id}/",
            {"test_id": self.test.test_id},
            format="json",
        )
        self.assertEqual(add_test_response.status_code, 200)
        self.assertEqual(Decimal(add_test_response.data["total_amount"]), Decimal("150.00"))

        discount_response = self.client.patch(
            f"/api/billing/apply-discount/{invoice_id}/",
            {"discount": "10.00"},
            format="json",
        )
        self.assertEqual(discount_response.status_code, 200)
        self.assertEqual(Decimal(discount_response.data["total_amount"]), Decimal("140.00"))

        payment_response = self.client.post(
            f"/api/billing/record-payment/{invoice_id}/",
            {"amount": "100.00", "payment_method": "UPI"},
            format="json",
        )
        self.assertEqual(payment_response.status_code, 201)
        payment_id = payment_response.data["payment_id"]
        invoice = Invoice.objects.get(invoice_id=invoice_id)
        self.assertEqual(invoice.status, Invoice.Status.PARTIALLY_PAID)
        self.assertEqual(invoice.balance_due, Decimal("40.00"))

        refund_response = self.client.post(
            f"/api/billing/refund-payment/{payment_id}/",
            format="json",
        )
        self.assertEqual(refund_response.status_code, 200)
        self.assertEqual(refund_response.data["status"], Payment.Status.REFUNDED)

        invoice.refresh_from_db()
        self.assertEqual(invoice.status, Invoice.Status.UNPAID)
        self.assertEqual(invoice.amount_paid, Decimal("0.00"))
        self.assertEqual(invoice.balance_due, Decimal("140.00"))
