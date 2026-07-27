from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from reports.pdf_generator import ReportPDFGenerator
from reports.services import ReportService
from visits.models import Visit


def download_report(request, visit_id):
    visit = get_object_or_404(
        Visit,
        visit_id=visit_id,
    )

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
