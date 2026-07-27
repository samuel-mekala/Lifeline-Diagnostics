from django.urls import path

from reports.views import DownloadReportAPIView

urlpatterns = [
    path(
        "<str:visit_id>/download/",
        DownloadReportAPIView.as_view(),
        name="download_report",
    ),
]
