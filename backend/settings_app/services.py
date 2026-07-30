from django.db import transaction
from settings_app.models import SystemSettings

class SystemSettingsService:
    @staticmethod
    def get():
        settings, _ = SystemSettings.objects.get_or_create(pk=1)
        return settings

    @staticmethod
    @transaction.atomic
    def update(*, data):
        settings = SystemSettingsService.get()
        for field, value in data.items(): setattr(settings, field, value)
        settings.save(update_fields=[*data.keys(), "updated_at"])
        return settings
