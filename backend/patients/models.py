import uuid

from django.db import models
from django.db.models import Q
from django.utils import timezone

from accounts.models import User


class Patient(models.Model):
    GENDER_CHOICES = [
        ("M", "Male"),
        ("F", "Female"),
        ("O", "Other"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    patient_id = models.CharField(
        max_length=20,
        unique=True,
    )

    full_name = models.CharField(
        max_length=255,
    )

    date_of_birth = models.DateField()

    gender = models.CharField(
        max_length=1,
        choices=GENDER_CHOICES,
    )

    phone = models.CharField(
        max_length=15,
    )

    email = models.EmailField(
        blank=True,
        null=True,
    )

    address = models.TextField()

    registered_on = models.DateTimeField(
        auto_now_add=True,
    )

    linked_user = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    @property
    def age(self):
        today = timezone.now().date()

        age = today.year - self.date_of_birth.year

        if (
            (today.month, today.day)
            < (self.date_of_birth.month, self.date_of_birth.day)
        ):
            age -= 1

        return age

    @property
    def gender_display(self):
        return self.get_gender_display()

    def __str__(self):
        return f"{self.patient_id} - {self.full_name}"


class PatientAddress(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="addresses")
    label = models.CharField(max_length=50, default="Home")
    address = models.TextField()
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_default", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["patient"],
                condition=Q(is_default=True),
                name="unique_default_address_per_patient",
            ),
        ]
