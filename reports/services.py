from django.db import transaction
from django.utils import timezone
from common.services.id_generator import generate_business_id
from billing.models import InvoiceItem
from laboratory.models import OrderedTest, Package, Result
from reports.models import Report


class ReportService:

    @staticmethod
    def validate_report_completeness(visit):
        ordered_tests = OrderedTest.objects.filter(
            visit=visit,
        ).select_related("laboratory_test", "result")

        if not ordered_tests.exists():
            raise ValueError("Cannot generate report: no ordered tests exist for this visit.")

        missing_results = [
            ordered_test.laboratory_test.name
            for ordered_test in ordered_tests
            if not hasattr(ordered_test, "result")
        ]
        if missing_results:
            raise ValueError(
                "Cannot generate report: results are missing for ordered tests: "
                + ", ".join(missing_results)
                + "."
            )

        unapproved_results = [
            ordered_test.laboratory_test.name
            for ordered_test in ordered_tests
            if ordered_test.result.status != Result.Status.APPROVED
        ]
        if unapproved_results:
            raise ValueError(
                "Cannot generate report: results are not approved for ordered tests: "
                + ", ".join(unapproved_results)
                + "."
            )

        ReportService.validate_package_completeness(
            visit=visit,
            ordered_tests=ordered_tests,
        )

    @staticmethod
    def validate_package_completeness(*, visit, ordered_tests):
        package_ids = InvoiceItem.objects.filter(
            invoice__visit=visit,
            item_type=InvoiceItem.ItemType.PACKAGE,
        ).values_list("item_id", flat=True)

        packages = Package.objects.filter(
            package_id__in=package_ids,
        ).prefetch_related("package_tests__laboratory_test")

        ordered_test_ids = set(
            ordered_tests.values_list("laboratory_test_id", flat=True)
        )

        for package in packages:
            missing_test_names = [
                package_test.laboratory_test.name
                for package_test in package.package_tests.all()
                if package_test.laboratory_test_id not in ordered_test_ids
            ]
            if missing_test_names:
                raise ValueError(
                    f"Cannot generate report: package '{package.name}' is incomplete; "
                    "ordered tests are missing for: "
                    + ", ".join(missing_test_names)
                    + "."
                )

    @staticmethod
    @transaction.atomic
    def get_report_data(visit):
        ReportService.validate_report_completeness(visit)

        report, created = Report.objects.get_or_create(
            visit=visit,
        )

        if not report.report_id:
            report.report_id = generate_business_id(
                Report,
                "report_id",
                "REP",
            )

            report.save(update_fields=["report_id"])

        approved_results = (
            Result.objects.filter(
                sample__visit=visit,
                status=Result.Status.APPROVED,
            )
            .select_related(
                "ordered_test",
                "sample",
            )
            .prefetch_related(
                "parameters__test_parameter",
            )
        )

        report.status = Report.Status.GENERATED
        report.generated_at = timezone.now()
        report.save(
            update_fields=[
                "status",
                "generated_at",
                "updated_at",
            ]
        )

        return {
            "report": report,
            "visit": visit,
            "patient": visit.patient,
            "results": approved_results,
        }
