from django.http import HttpResponse

from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import PathologistPermission
from common.pagination import OptionalPageNumberPagination
from reports.pdf_generator import ReportPDFGenerator
from reports.serializers import ReportListQuerySerializer, ReportSerializer
from reports.services import ReportService
from visits.models import Visit
from visits.services import VisitService


class ReportListAPIView(APIView):
    permission_classes = [PathologistPermission]

    def get(self, request):
        serializer = ReportListQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        reports = ReportService.list_reports(filters=serializer.validated_data)
        paginator = OptionalPageNumberPagination()
        page = paginator.paginate_queryset(reports, request, view=self)
        if page is not None:
            return paginator.get_paginated_response(ReportSerializer(page, many=True).data)
        return Response(ReportSerializer(reports, many=True).data)


class DownloadReportAPIView(APIView):
    permission_classes = [PathologistPermission]

    def get(self, request, visit_id):
        try:
            visit = VisitService.get_visit(visit_id=visit_id)
        except Visit.DoesNotExist as exc:
            raise NotFound("Visit not found.") from exc

        try:
            report_data = ReportService.get_report_data(
                visit,
            )
            include_header = request.GET.get("plain") != "true"
            pdf = ReportPDFGenerator.generate(
                report_data,
                include_header=include_header,
                verification_url=request.build_absolute_uri(f"/reports/verify/{report_data['report'].verification_token}/"),
            )
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

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


class VerifyReportAPIView(APIView):
    permission_classes = []
    authentication_classes = []

    def get(self, request, token):
        try:
            report = ReportService.get_verified_report(token=token)
        except ValueError:
            return Response({"valid": False}, status=status.HTTP_404_NOT_FOUND)
        return Response({"valid": True, "report_id": report.report_id, "status": report.status, "patient": report.visit.patient.full_name, "generated_at": report.generated_at})
