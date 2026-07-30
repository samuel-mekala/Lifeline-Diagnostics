from django.contrib import admin
from common.admin import BusinessIDAdmin

from .models import Report
# Register your models here.


@admin.register(Report)
class ReportAdmin(BusinessIDAdmin):
    business_id_field = "report_id"
    business_id_prefix = "REP"

    exclude = ("report_id",)

    list_display = (
        "report_id",
        "visit",
        "status",
        "generated_at",
    )

    search_fields = (
        "report_id",
        "visit__visit_id",
        "visit__patient__full_name",
    )

    list_filter = (
        "status",
    )