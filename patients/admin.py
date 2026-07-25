from common.services.id_generator import generate_business_id
from django.contrib import admin

from .models import Patient

# Register your models here.


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
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

    def save_model(self, request, obj, form, change):
        if not obj.patient_id:
            obj.patient_id = generate_business_id(
                model=Patient,
                field="patient_id",
                prefix="PAT",
            )

        super().save_model(request, obj, form, change)
