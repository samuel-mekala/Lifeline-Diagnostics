from django.urls import path
from patient_portal import views

urlpatterns = [
    # Patient profile
    path("profile/", views.PortalProfileAPIView.as_view(), name="portal-profile"),

    # Addresses (home collection)
    path("addresses/", views.PortalAddressListAPIView.as_view(), name="portal-addresses"),

    # Appointments
    path("appointments/", views.PortalAppointmentListAPIView.as_view(), name="portal-appointments"),
    path("book/", views.PortalBookAppointmentAPIView.as_view(), name="portal-book"),

    # Invoices
    path("invoices/", views.PortalInvoiceListAPIView.as_view(), name="portal-invoices"),

    # Reports
    path("reports/", views.PortalReportListAPIView.as_view(), name="portal-reports"),

    # Test & Package catalog
    path("catalog/tests/", views.PortalTestCatalogAPIView.as_view(), name="portal-catalog-tests"),
    path("catalog/packages/", views.PortalPackageCatalogAPIView.as_view(), name="portal-catalog-packages"),
]
