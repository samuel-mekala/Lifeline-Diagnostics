from django.urls import path
from analytics.views import AnalyticsOverviewAPIView
urlpatterns = [path("overview/", AnalyticsOverviewAPIView.as_view(), name="analytics-overview")]
