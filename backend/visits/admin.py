from django.contrib import admin
from common.admin import BusinessIDAdmin
from .models import Visit

# Register your models here.

@admin.register(Visit)
class VisitAdmin(BusinessIDAdmin):
    business_id_field = "visit_id"
    business_id_prefix = "VIS"
    exclude = ("visit_id",)

    list_display = (
        "visit_id",
        "id",
        "patient",
        "status",
        "created_at",
    )

    search_fields = (
        "visit_id",
        "patient__full_name",
        "patient__patient_id",
    )

    list_filter = (
        "status",
        "created_at",
    )

    ordering = ("-created_at",)