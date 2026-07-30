from rest_framework import serializers
from common.models import ActivityLog

class ActivityLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.full_name", read_only=True, allow_null=True, default=None)
    class Meta:
        model = ActivityLog
        fields = ("id", "actor_name", "action", "entity_type", "entity_id", "metadata", "created_at")
