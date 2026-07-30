from rest_framework import serializers
from settings_app.models import SystemSettings

class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = ("laboratory_name", "laboratory_address", "laboratory_phone", "laboratory_email", "logo_url", "primary_color", "email_from_name", "email_reply_to", "tax_name", "tax_rate", "timezone", "currency", "updated_at")
        read_only_fields = ("updated_at",)
