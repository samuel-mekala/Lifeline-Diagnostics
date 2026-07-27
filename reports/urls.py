from django.urls import path

from reports.views import download_report

urlpatterns = [
    path(
        "<str:visit_id>/download/",
        download_report,
        name="download_report",
    ),
]
