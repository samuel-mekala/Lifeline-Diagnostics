from django.http import HttpResponse

from rest_framework.exceptions import NotFound
from rest_framework.views import APIView

from accounts.permissions import PathologistPermission
from reports.pdf_generator import ReportPDFGenerator
from reports.services import ReportService
from visits.models import Visit


class DownloadReportAPIView(APIView):
    permission_classes = [PathologistPermission]

    def get(self, request, visit_id):
        try:
            visit = Visit.objects.get(visit_id=visit_id)
        except Visit.DoesNotExist as exc:
            raise NotFound("Visit not found.") from exc

        report_data = ReportService.get_report_data(
            visit,
        )

        include_header = (
            request.GET.get("plain") != "true"
        )

        pdf = ReportPDFGenerator.generate(
            report_data,
            include_header=include_header,
        )

        response = HttpResponse(
            pdf,
            content_type="application/pdf",
        )

        report = report_data["report"]
        patient = report_data["patient"]

        filename = (
            f"{report.report_id}_{patient.patient_id}.pdf"
        )

        response["Content-Disposition"] = (
            f'attachment; filename="{filename}"'
        )

        return response
