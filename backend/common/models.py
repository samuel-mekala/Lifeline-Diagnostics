from django.conf import settings
from django.db import models


class ActivityLog(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="activity_logs")
    action = models.CharField(max_length=100, db_index=True)
    entity_type = models.CharField(max_length=100, blank=True)
    entity_id = models.CharField(max_length=100, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta: ordering = ["-created_at"]


class BusinessIDSequence(models.Model):
    key = models.CharField(max_length=255, unique=True)
    next_number = models.PositiveBigIntegerField(default=1)
