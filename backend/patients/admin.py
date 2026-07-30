from django.contrib import admin
from common.admin import BusinessIDAdmin
from .models import Patient

# Register your models here.


@admin.register(Patient)
class PatientAdmin(BusinessIDAdmin):
    business_id_field = "patient_id"
    business_id_prefix = "PAT"
    exclude = ("patient_id",)
    list_display = (
        "patient_id",
        "full_name",
        "phone",
        "gender",
        "registered_on",
    )

    search_fields = (
        "patient_id",
        "full_name",
        "phone",
    )

    list_filter = (
        "gender",
        "registered_on",
    )

    ordering = ("patient_id",)