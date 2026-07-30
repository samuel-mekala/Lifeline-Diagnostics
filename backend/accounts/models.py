from django.db import models
from django.utils import timezone
from django.contrib.auth.models import PermissionsMixin
from django.contrib.auth.base_user import AbstractBaseUser

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        OWNER = "OWNER", "Owner"
        ADMIN = "ADMIN", "Admin"
        RECEPTIONIST = "RECEPTIONIST", "Receptionist"
        LAB_TECHNICIAN = "LAB_TECHNICIAN", "Lab Technician"
        PATHOLOGIST = "PATHOLOGIST", "Pathologist"
        PATIENT = "PATIENT", "Patient"

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=15, blank=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.RECEPTIONIST,
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    def __str__(self):
        return self.email


class EmailOTP(models.Model):
    email = models.EmailField(db_index=True)
    code_hash = models.CharField(max_length=128)
    purpose = models.CharField(max_length=30, default="LOGIN")
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    failed_attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_valid(self):
        return self.used_at is None and self.expires_at > timezone.now()
