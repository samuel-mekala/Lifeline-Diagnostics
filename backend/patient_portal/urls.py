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

    # Invoices & Payments
    path("invoices/", views.PortalInvoiceListAPIView.as_view(), name="portal-invoices"),
    path("invoices/<str:invoice_id>/pay/", views.PortalPayInvoiceAPIView.as_view(), name="portal-invoice-pay"),


    # Reports
    path("reports/", views.PortalReportListAPIView.as_view(), name="portal-reports"),

    # Test & Package catalog
    path("catalog/tests/", views.PortalTestCatalogAPIView.as_view(), name="portal-catalog-tests"),
    path("catalog/packages/", views.PortalPackageCatalogAPIView.as_view(), name="portal-catalog-packages"),

    # Staff operations
    path("staff-appointments/", views.PortalStaffAppointmentListAPIView.as_view(), name="portal-staff-appointments"),
    path("staff-appointments/<str:appointment_id>/update/", views.PortalStaffUpdateAppointmentAPIView.as_view(), name="portal-staff-appointment-update"),
    path("staff-patients/", views.PortalStaffPatientListAPIView.as_view(), name="portal-staff-patients"),
    path("staff-walkin-register/", views.PortalStaffWalkInRegisterAPIView.as_view(), name="portal-staff-walkin-register"),
    path("staff-all-invoices/", views.PortalStaffAllInvoicesAPIView.as_view(), name="portal-staff-all-invoices"),
    path("staff-all-reports/", views.PortalStaffAllReportsAPIView.as_view(), name="portal-staff-all-reports"),

    # Staff workflow endpoints
    path("staff-collect-sample/", views.PortalStaffCollectSampleAPIView.as_view(), name="portal-staff-collect-sample"),
    path("staff-mark-tested/", views.PortalStaffMarkTestedAPIView.as_view(), name="portal-staff-mark-tested"),
    path("staff-test-parameters/<str:appointment_id>/", views.PortalStaffGetTestParametersAPIView.as_view(), name="portal-staff-test-parameters"),
    path("staff-submit-results/", views.PortalStaffSubmitResultsAPIView.as_view(), name="portal-staff-submit-results"),
    path("staff-approve-reject/", views.PortalStaffApproveRejectAPIView.as_view(), name="portal-staff-approve-reject"),
    path("staff-collect-payment/", views.PortalStaffCollectPaymentAPIView.as_view(), name="portal-staff-collect-payment"),
    path("staff-result-values/<str:appointment_id>/", views.PortalStaffGetResultValuesAPIView.as_view(), name="portal-staff-result-values"),
]
