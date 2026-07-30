from django.urls import path

from reports.views import DownloadReportAPIView, ReportListAPIView, VerifyReportAPIView

urlpatterns = [
    path("list/", ReportListAPIView.as_view(), name="report-list"),
    path("verify/<uuid:token>/", VerifyReportAPIView.as_view(), name="verify-report"),
    path(
        "<str:visit_id>/download/",
        DownloadReportAPIView.as_view(),
        name="download_report",
    ),
]
