from datetime import date
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from billing.models import Invoice, InvoiceItem
from laboratory.models import LaboratoryTest, OrderedTest, Package, PackageTest, Result, Sample
from laboratory.services import LaboratoryTestService
from patients.models import Patient
from reports.models import Report
from reports.services import ReportService
from visits.models import Visit


class ReportCompletenessServiceTests(TestCase):
    def setUp(self):
        patient = Patient.objects.create(
            patient_id="PAT-REPORT-1",
            full_name="Report Patient",
            date_of_birth=date(1990, 1, 1),
            gender="M",
            phone="9777777777",
            address="Report test address",
        )
        self.visit = Visit.objects.create(
            visit_id="VIS-REPORT-1",
            patient=patient,
        )
        self.sample = Sample.objects.create(
            sample_id="SAM-REPORT-1",
            visit=self.visit,
            sample_type="BLOOD",
            status="COLLECTED",
        )

    def create_laboratory_test(self, name):
        return LaboratoryTestService.create_test(
            name=name,
            category="BIOCHEMISTRY",
            sample_type="BLOOD",
        )

    def create_ordered_test(self, laboratory_test):
        return OrderedTest.objects.create(
            order_id=f"ORD-REPORT-{OrderedTest.objects.count() + 1}",
            visit=self.visit,
            laboratory_test=laboratory_test,
            sample=self.sample,
            status="SAMPLE_COLLECTED",
        )

    def approve_result(self, ordered_test):
        return Result.objects.create(
            result_id=f"RES-REPORT-{Result.objects.count() + 1}",
            sample=self.sample,
            ordered_test=ordered_test,
            status=Result.Status.APPROVED,
        )

    def test_report_requires_a_result_for_every_ordered_test(self):
        laboratory_test = self.create_laboratory_test("Missing Result Test")
        self.create_ordered_test(laboratory_test)

        with self.assertRaisesMessage(
            ValueError,
            "Cannot generate report: results are missing for ordered tests: Missing Result Test.",
        ):
            ReportService.get_report_data(self.visit)

        self.assertFalse(Report.objects.filter(visit=self.visit).exists())

    def test_report_requires_every_result_to_be_approved(self):
        laboratory_test = self.create_laboratory_test("Unapproved Result Test")
        ordered_test = self.create_ordered_test(laboratory_test)
        Result.objects.create(
            result_id="RES-REPORT-DRAFT",
            sample=self.sample,
            ordered_test=ordered_test,
            status=Result.Status.DRAFT,
        )

        with self.assertRaisesMessage(
            ValueError,
            "Cannot generate report: results are not approved for ordered tests: Unapproved Result Test.",
        ):
            ReportService.get_report_data(self.visit)

    def test_package_report_requires_every_package_test_to_be_ordered(self):
        completed_test = self.create_laboratory_test("Completed Package Test")
        missing_test = self.create_laboratory_test("Missing Package Test")
        completed_ordered_test = self.create_ordered_test(completed_test)
        self.approve_result(completed_ordered_test)

        package = Package.objects.create(
            package_id="PKG-REPORT-1",
            name="Report Package",
        )
        PackageTest.objects.create(
            package=package,
            laboratory_test=completed_test,
            display_order=1,
        )
        PackageTest.objects.create(
            package=package,
            laboratory_test=missing_test,
            display_order=2,
        )
        invoice = Invoice.objects.create(
            invoice_id="INV-REPORT-1",
            visit=self.visit,
        )
        InvoiceItem.objects.create(
            invoice=invoice,
            item_type=InvoiceItem.ItemType.PACKAGE,
            item_id=package.package_id,
            item_name=package.name,
            unit_price=Decimal("100.00"),
            line_total=Decimal("100.00"),
        )

        with self.assertRaisesMessage(
            ValueError,
            "Cannot generate report: package 'Report Package' is incomplete; "
            "ordered tests are missing for: Missing Package Test.",
        ):
            ReportService.get_report_data(self.visit)

    def test_complete_approved_results_generate_a_report(self):
        first_test = self.create_laboratory_test("First Complete Test")
        second_test = self.create_laboratory_test("Second Complete Test")
        self.approve_result(self.create_ordered_test(first_test))
        self.approve_result(self.create_ordered_test(second_test))

        report_data = ReportService.get_report_data(self.visit)

        self.assertEqual(report_data["report"].status, Report.Status.GENERATED)
        self.assertEqual(report_data["results"].count(), 2)

    def test_report_endpoint_returns_a_clear_incomplete_report_error(self):
        laboratory_test = self.create_laboratory_test("Endpoint Missing Result Test")
        self.create_ordered_test(laboratory_test)
        pathologist = User.objects.create_user(
            email="report-pathologist@example.com",
            full_name="Report Pathologist",
            password="strong-password-123",
            role=User.Role.PATHOLOGIST,
        )
        client = APIClient()
        client.force_authenticate(pathologist)

        response = client.get(f"/reports/{self.visit.visit_id}/download/")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data["error"],
            "Cannot generate report: results are missing for ordered tests: "
            "Endpoint Missing Result Test.",
        )
