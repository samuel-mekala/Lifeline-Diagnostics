import uuid

from django.db import models
from django.conf import settings

from patients.models import Patient

# Create your models here.


class Visit(models.Model):
    class EntryMode(models.TextChoices):
        WALK_IN = "WALK_IN", "Walk In"
        HOME_COLLECTION = "HOME_COLLECTION", "Home Collection"
        ONLINE = "ONLINE", "Online"
        DOCTOR_REFERRAL = "DOCTOR_REFERRAL", "Doctor Referral"

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

    entry_mode = models.CharField(
        max_length=20,
        choices=EntryMode.choices,
        default=EntryMode.WALK_IN,
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


class Appointment(models.Model):
    class CollectionType(models.TextChoices):
        HOME = "HOME", "Home Collection"
        LAB = "LAB", "Lab Visit"

    class Status(models.TextChoices):
        # Online bookings
        PENDING = "PENDING", "Pending (Awaiting Acceptance)"
        ACCEPTED = "ACCEPTED", "Accepted by Technician"
        VISITED = "VISITED", "Patient Visited / Technician Visited Home"
        SAMPLE_COLLECTED = "SAMPLE_COLLECTED", "Sample Collected"
        TESTED = "TESTED", "Testing Completed"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review (Pathologist/Owner)"
        APPROVED = "APPROVED", "Approved — Report Ready"
        REJECTED = "REJECTED", "Rejected — Values Need Correction"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"
        # Walk-in / direct
        BOOKED = "BOOKED", "Booked"

    class PaymentStatus(models.TextChoices):
        UNPAID = "UNPAID", "Unpaid"
        PAID = "PAID", "Paid"
        PARTIALLY_PAID = "PARTIALLY_PAID", "Partially Paid"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="appointments")
    visit = models.OneToOneField(Visit, on_delete=models.SET_NULL, null=True, blank=True, related_name="appointment")
    collection_type = models.CharField(max_length=10, choices=CollectionType.choices)
    scheduled_for = models.DateTimeField()
    address = models.ForeignKey("patients.PatientAddress", on_delete=models.SET_NULL, null=True, blank=True, related_name="appointments")
    status = models.CharField(max_length=25, choices=Status.choices, default=Status.PENDING)
    payment_preference = models.CharField(max_length=20, choices=[("PAY_NOW", "Pay Now"), ("PAY_LATER", "Pay Later")], default="PAY_LATER")
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_appointments")
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["patient", "status"]), models.Index(fields=["scheduled_for", "status"])]

