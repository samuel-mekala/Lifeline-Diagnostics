import uuid

from django.db import models

from visits.models import Visit

# Create your models here.

class Report(models.Model):

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        GENERATED = "GENERATED", "Generated"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    report_id = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
    )

    verification_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    visit = models.OneToOneField(
        Visit,
        on_delete=models.CASCADE,
        related_name="report",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    generated_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"{self.report_id} - {self.visit.visit_id}"
