from django.urls import path
from settings_app.views import SystemSettingsAPIView
urlpatterns = [path("", SystemSettingsAPIView.as_view(), name="system-settings")]
