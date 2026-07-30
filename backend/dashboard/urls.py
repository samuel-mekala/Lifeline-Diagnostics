from django.urls import path

from dashboard.views import (
    DashboardPendingAPIView,
    DashboardRecentAPIView,
    DashboardStatisticsAPIView,
    DashboardSummaryAPIView,
)


urlpatterns = [
    path("summary/", DashboardSummaryAPIView.as_view(), name="dashboard-summary"),
    path("recent/", DashboardRecentAPIView.as_view(), name="dashboard-recent"),
    path("pending/", DashboardPendingAPIView.as_view(), name="dashboard-pending"),
    path(
        "statistics/",
        DashboardStatisticsAPIView.as_view(),
        name="dashboard-statistics",
    ),
]
