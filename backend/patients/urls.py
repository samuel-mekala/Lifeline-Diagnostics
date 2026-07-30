from django.urls import path
from patients.address_views import AddressDetailAPIView, AddressListAPIView

from patients.views import (
    CreatePatientAPIView,
    PatientDetailAPIView,
    PatientListAPIView,
    PatientSearchAPIView,
    UpdatePatientAPIView,
)


urlpatterns = [
    path("addresses/", AddressListAPIView.as_view(), name="address-list"),
    path("addresses/<uuid:address_id>/", AddressDetailAPIView.as_view(), name="address-detail"),
    path("create/", CreatePatientAPIView.as_view(), name="create-patient"),
    path("list/", PatientListAPIView.as_view(), name="patient-list"),
    path("search/", PatientSearchAPIView.as_view(), name="patient-search"),
    path("update/<str:patient_id>/", UpdatePatientAPIView.as_view(), name="update-patient"),
    path("<str:patient_id>/", PatientDetailAPIView.as_view(), name="patient-detail"),
]
