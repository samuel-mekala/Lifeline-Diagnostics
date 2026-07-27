from django.utils import timezone
from common.services.id_generator import generate_business_id
from laboratory.models import Result
from reports.models import Report


class ReportService:

    @staticmethod
    def get_report_data(visit):
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