import uuid

from django.db import models

from patients.models import Patient

# Create your models here.


class Visit(models.Model):
    STATUS_CHOICES = [
        ("REGISTERED", "Registered"),
        ("SAMPLE_COLLECTED", "Sample Collected"),
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    visit_id = models.CharField(
        max_length=20,
        unique=True,
    )

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="visits",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="REGISTERED",
    )

    remarks = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return f"{self.visit_id} - {self.patient.full_name}"