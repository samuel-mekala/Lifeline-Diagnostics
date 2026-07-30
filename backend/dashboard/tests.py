from datetime import datetime, time, timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from billing.models import Invoice, Payment
from laboratory.models import LaboratoryTest, OrderedTest, Result, Sample
from patients.models import Patient
from reports.models import Report
from visits.models import Visit


class DashboardAPIViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="dashboard@example.com",
            full_name="Dashboard User",
            password="strong-password-123",
            role=User.Role.ADMIN,
        )
        self.patient = self.create_patient("1")
        self.visit = self.create_visit(self.patient, "1")
        self.sample = Sample.objects.create(
            sample_id="SAM-DASHBOARD-1",
            visit=self.visit,
            sample_type="BLOOD",
            status="COLLECTED",
        )
        self.laboratory_test = LaboratoryTest.objects.create(
            test_id="TES-DASHBOARD-1",
            name="Dashboard Test",
            category="BIOCHEMISTRY",
            sample_type="BLOOD",
        )
        self.results = {
            status: self.create_result(status)
            for status in Result.Status.values
        }
        self.generated_report = Report.objects.create(
            report_id="REP-DASHBOARD-1",
            visit=self.visit,
            status=Report.Status.GENERATED,
            generated_at=timezone.now(),
        )
        self.paid_invoice = self.create_invoice("2", Invoice.Status.PAID)
        self.pending_invoice = self.create_invoice("3", Invoice.Status.UNPAID)
        Payment.objects.create(
            payment_id="PAY-DASHBOARD-1",
            invoice=self.paid_invoice,
            amount=Decimal("120.00"),
            payment_method=Payment.PaymentMethod.CASH,
            status=Payment.Status.SUCCESS,
        )
        self.client.force_authenticate(self.user)

    def create_patient(self, suffix):
        return Patient.objects.create(
            patient_id=f"PAT-DASHBOARD-{suffix}",
            full_name=f"Dashboard Patient {suffix}",
            date_of_birth=timezone.localdate().replace(year=1990),
            gender="M",
            phone=f"90000000{suffix.zfill(2)}",
            address="Dashboard address",
        )

    def create_visit(self, patient, suffix):
        return Visit.objects.create(
            visit_id=f"VIS-DASHBOARD-{suffix}",
            patient=patient,
        )

    def create_result(self, status):
        ordered_test = OrderedTest.objects.create(
            order_id=f"ORD-DASHBOARD-{status}",
            visit=self.visit,
            laboratory_test=self.laboratory_test,
            sample=self.sample,
            status="SAMPLE_COLLECTED",
        )
        return Result.objects.create(
            result_id=f"RES-DASHBOARD-{status}",
            sample=self.sample,
            ordered_test=ordered_test,
            status=status,
        )

    def create_invoice(self, suffix, status):
        patient = self.create_patient(suffix)
        visit = self.create_visit(patient, suffix)
        return Invoice.objects.create(
            invoice_id=f"INV-DASHBOARD-{suffix}",
            visit=visit,
            status=status,
            total_amount=Decimal("120.00"),
            amount_paid=(
                Decimal("120.00")
                if status == Invoice.Status.PAID
                else Decimal("0.00")
            ),
            balance_due=(
                Decimal("0.00")
                if status == Invoice.Status.PAID
                else Decimal("120.00")
            ),
        )

    def test_dashboard_endpoints_require_authentication(self):
        self.client.force_authenticate(user=None)

        for endpoint in ("summary/", "recent/", "pending/", "statistics/"):
            with self.subTest(endpoint=endpoint):
                self.assertEqual(
                    self.client.get(f"/api/dashboard/{endpoint}").status_code,
                    401,
                )

    def test_summary_returns_current_counts_and_revenue(self):
        response = self.client.get("/api/dashboard/summary/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total_patients"], 3)
        self.assertEqual(response.data["today_visits"], 3)
        self.assertEqual(
            response.data["results"],
            {"draft": 1, "submitted": 1, "approved": 1, "rejected": 1},
        )
        self.assertEqual(
            response.data["invoices"],
            {"total": 2, "pending": 1, "paid": 1},
        )
        self.assertEqual(response.data["today_revenue"], "120.00")

    def test_summary_excludes_non_successful_payments_from_revenue(self):
        Payment.objects.create(
            payment_id="PAY-DASHBOARD-FAILED",
            invoice=self.paid_invoice,
            amount=Decimal("20.00"),
            payment_method=Payment.PaymentMethod.CASH,
            status=Payment.Status.FAILED,
        )

        response = self.client.get("/api/dashboard/summary/")

        self.assertEqual(response.data["today_revenue"], "120.00")

    def test_recent_returns_a_combined_chronological_list(self):
        response = self.client.get("/api/dashboard/recent/")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            {"patient", "report", "invoice"}.issubset(
                {item["type"] for item in response.data}
            )
        )
        timestamps = [item["timestamp"] for item in response.data]
        self.assertEqual(timestamps, sorted(timestamps, reverse=True))

    def test_recent_excludes_reports_that_are_not_generated(self):
        draft_report_visit = self.create_visit(self.patient, "4")
        Report.objects.create(
            report_id="REP-DASHBOARD-DRAFT",
            visit=draft_report_visit,
            status=Report.Status.DRAFT,
        )

        response = self.client.get("/api/dashboard/recent/")

        self.assertNotIn(
            "REP-DASHBOARD-DRAFT",
            [item["identifier"] for item in response.data],
        )

    def test_pending_returns_draft_submitted_results_and_open_invoices(self):
        response = self.client.get("/api/dashboard/pending/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["draft_results"][0]["result_id"],
            self.results["DRAFT"].result_id,
        )
        self.assertEqual(
            response.data["submitted_results"][0]["result_id"],
            self.results["SUBMITTED"].result_id,
        )
        self.assertEqual(
            response.data["pending_invoices"][0]["invoice_id"],
            self.pending_invoice.invoice_id,
        )

    def test_statistics_count_only_the_current_month(self):
        previous_month = timezone.localdate().replace(day=1) - timedelta(days=1)
        previous_month_start = timezone.make_aware(
            datetime.combine(previous_month, time.min)
        )
        old_patient = self.create_patient("5")
        old_visit = self.create_visit(old_patient, "5")
        old_report = Report.objects.create(
            report_id="REP-DASHBOARD-OLD",
            visit=old_visit,
            status=Report.Status.GENERATED,
            generated_at=timezone.now(),
        )
        old_payment = Payment.objects.create(
            payment_id="PAY-DASHBOARD-OLD",
            invoice=self.paid_invoice,
            amount=Decimal("50.00"),
            payment_method=Payment.PaymentMethod.CASH,
            status=Payment.Status.SUCCESS,
        )
        Patient.objects.filter(pk=old_patient.pk).update(registered_on=previous_month_start)
        Visit.objects.filter(pk=old_visit.pk).update(created_at=previous_month_start)
        Report.objects.filter(pk=old_report.pk).update(generated_at=previous_month_start)
        Payment.objects.filter(pk=old_payment.pk).update(paid_at=previous_month_start)

        response = self.client.get("/api/dashboard/statistics/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["patients_this_month"], 3)
        self.assertEqual(response.data["visits_this_month"], 3)
        self.assertEqual(response.data["reports_generated_this_month"], 1)
        self.assertEqual(response.data["revenue_this_month"], "120.00")

    def test_all_dashboard_endpoints_are_available_to_authenticated_users(self):
        for endpoint in ("summary/", "recent/", "pending/", "statistics/"):
            with self.subTest(endpoint=endpoint):
                self.assertEqual(
                    self.client.get(f"/api/dashboard/{endpoint}").status_code,
                    200,
                )
