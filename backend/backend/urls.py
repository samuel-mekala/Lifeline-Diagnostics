from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('lab_app.urls')),
    path('api/patients-app/', include('patients.urls')),
    path('api/appointments-app/', include('appointments.urls')),
    path('api/catalog-app/', include('catalog.urls')),
    path('api/samples-app/', include('samples.urls')),
    path('api/billing-app/', include('billing.urls')),
    path('api/reports-app/', include('reports.urls')),
    path('api/inventory-app/', include('inventory.urls')),
    path('api/audit-app/', include('audit_logs.urls')),
    path('api/employees-app/', include('employees.urls')),
    path('api/branches-app/', include('branches.urls')),
    path('api/roles/lab-admin/', include('lab_admin.urls')),
    path('api/roles/pathologists/', include('pathologists.urls')),
    path('api/roles/phlebotomists/', include('phlebotomists.urls')),
    path('api/roles/lab-technicians/', include('lab_technicians.urls')),
    path('api/roles/reception-desk/', include('reception_desk.urls')),
    path('api/roles/patient-portal/', include('patient_portal.urls')),
]
