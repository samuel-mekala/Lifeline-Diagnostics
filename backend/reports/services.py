from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from common.services.id_generator import generate_business_id
from billing.models import InvoiceItem
from laboratory.models import OrderedTest, Package, Result
from reports.models import Report


class ReportService:

    @staticmethod
    def get_verified_report(*, token):
        try:
            return Report.objects.select_related("visit__patient").get(verification_token=token)
        except Report.DoesNotExist as exc:
            raise ValueError("Report not found.") from exc

    @staticmethod
    def list_reports(*, filters):
        reports = Report.objects.select_related("visit__patient")
        if search := filters.get("search"):
            reports = reports.filter(
                Q(report_id__icontains=search)
                | Q(visit__patient__patient_id__icontains=search)
                | Q(visit__patient__full_name__icontains=search)
            )
        if patient_id := filters.get("patient_id"):
            reports = reports.filter(visit__patient__patient_id=patient_id)
        if status := filters.get("status"):
            reports = reports.filter(status=status)
        if generated_from := filters.get("generated_from"):
            reports = reports.filter(generated_at__date__gte=generated_from)
        if generated_to := filters.get("generated_to"):
            reports = reports.filter(generated_at__date__lte=generated_to)
        return reports.order_by(filters["ordering"])

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

        transitioned_to_generated = report.status != Report.Status.GENERATED
        report.status = Report.Status.GENERATED
        report.generated_at = timezone.now()
        report.save(
            update_fields=[
                "status",
                "generated_at",
                "updated_at",
            ]
        )
        if transitioned_to_generated and visit.patient.email:
            from notifications.services import get_notification_service
            get_notification_service().report_ready(
                recipient=visit.patient.email,
                patient_name=visit.patient.full_name,
                report_id=report.report_id,
            )
        if transitioned_to_generated:
            from common.services.activity import log_activity
            log_activity(action="report_generated", entity=report, metadata={"visit_id": visit.visit_id})

        return {
            "report": report,
            "visit": visit,
            "patient": visit.patient,
            "results": approved_results,
        }
