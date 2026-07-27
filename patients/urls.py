from django.urls import path

from patients.views import (
    CreatePatientAPIView,
    PatientDetailAPIView,
    PatientListAPIView,
    PatientSearchAPIView,
    UpdatePatientAPIView,
)


urlpatterns = [
    path("create/", CreatePatientAPIView.as_view(), name="create-patient"),
    path("list/", PatientListAPIView.as_view(), name="patient-list"),
    path("search/", PatientSearchAPIView.as_view(), name="patient-search"),
    path("update/<str:patient_id>/", UpdatePatientAPIView.as_view(), name="update-patient"),
    path("<str:patient_id>/", PatientDetailAPIView.as_view(), name="patient-detail"),
]
