from django.contrib import admin

from common.services.id_generator import generate_business_id

from .models import Visit

# Register your models here.

@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    exclude = ("visit_id",)

    list_display = (
        "visit_id",
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

    def save_model(self, request, obj, form, change):
        if not obj.visit_id:
            obj.visit_id = generate_business_id(
                model=Visit,
                field="visit_id",
                prefix="VIS",
            )

        super().save_model(request, obj, form, change)
