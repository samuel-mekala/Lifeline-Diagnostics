from django.db import models


class Notification(models.Model):
    class Status(models.TextChoices):
        SENT = "SENT", "Sent"
        FAILED = "FAILED", "Failed"
        SKIPPED = "SKIPPED", "Skipped"

    recipient = models.EmailField()
    category = models.CharField(max_length=50)
    message = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices)
    error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.category} to {self.recipient} ({self.status})"
