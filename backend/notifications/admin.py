from django.contrib import admin

from notifications.models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("recipient", "category", "status", "created_at")
    list_filter = ("category", "status")
    search_fields = ("recipient", "message")
    readonly_fields = ("created_at",)
