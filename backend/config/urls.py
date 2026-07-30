"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from common.views import ActivityLogAPIView, ActivityLogFiltersAPIView, HealthAPIView

router = DefaultRouter()
urlpatterns = [
    path('admin/', admin.site.urls),
    path("health/", HealthAPIView.as_view(), name="health"),
    path("api/activity-logs/", ActivityLogAPIView.as_view(), name="activity-logs"),
    path("api/activity-logs/filters/", ActivityLogFiltersAPIView.as_view(), name="activity-log-filters"),
    path("", include("accounts.urls")),
    path("api/patients/", include("patients.urls")),
    path("api/visits/", include("visits.urls")),
    path("reports/", include("reports.urls")),
    path("api/billing/", include("billing.urls")),
    path("api/laboratory/", include("laboratory.urls")),
    path("api/dashboard/", include("dashboard.urls")),
    path("api/inventory/", include("inventory.urls")),
    path("api/analytics/", include("analytics.urls")),
    path("api/settings/", include("settings_app.urls")),
    path("api/employees/", include("employees.urls")),
    path("api/portal/", include("patient_portal.urls")),  # Patient-facing portal API
    path('api/', include(router.urls)),

    #path('', include('core.urls')),
]
