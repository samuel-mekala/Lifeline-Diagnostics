from common.choices import ORDERED_TEST_STATUS_CHOICES
from decimal import Decimal
import uuid
from django.conf import settings

from django.db import models

from common.choices import (
    SAMPLE_TYPE_CHOICES,
    TEST_CATEGORY_CHOICES,
    SAMPLE_STATUS_CHOICES,
)

# Create your models here.

class LaboratoryTest(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    test_id = models.CharField(
        max_length=20,
        unique=True,
    )

    name = models.CharField(
        max_length=150,
    )

    category = models.CharField(
        max_length=30,
        choices=TEST_CATEGORY_CHOICES,
    )

    sample_type = models.CharField(
        max_length=20,
        choices=SAMPLE_TYPE_CHOICES,
    )



    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )




    def __str__(self):
        return f"{self.test_id} - {self.name}"


class TestParameter(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    parameter_id = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
    )

    laboratory_test = models.ForeignKey(
        LaboratoryTest,
        on_delete=models.CASCADE,
        related_name="parameters",
    )

    name = models.CharField(
        max_length=100,
    )

    unit = models.CharField(
        max_length=30,
        blank=True,
    )

    reference_range = models.CharField(
        max_length=100,
        blank=True,
    )


    display_order = models.PositiveIntegerField()

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["laboratory_test", "name"],
                name="unique_parameter_name_per_test",
            ),
            models.UniqueConstraint(
                fields=["laboratory_test", "display_order"],
                name="unique_parameter_order_per_test",
            ),
        ]

    def __str__(self):
        return f"{self.laboratory_test.name} - {self.name}"


class Package(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    package_id = models.CharField(
        max_length=20,
        unique=True,
    )

    name = models.CharField(
        max_length=100,
        unique=True,
    )

    description = models.TextField(
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return self.name


class PackageTest(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    package = models.ForeignKey(
        Package,
        on_delete=models.CASCADE,
        related_name="package_tests",
    )

    laboratory_test = models.ForeignKey(
        LaboratoryTest,
        on_delete=models.PROTECT,
        related_name="package_tests",
    )

    display_order = models.PositiveIntegerField(
        default=1,
    )

    class Meta:
        ordering = ["display_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["package", "laboratory_test"],
                name="unique_test_per_package",
            )
        ]

    def __str__(self):
        return f"{self.package.name} - {self.laboratory_test.name}"


class TestPrice(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    laboratory_test = models.OneToOneField(
        LaboratoryTest,
        on_delete=models.CASCADE,
        related_name="pricing",
    )

    walk_in_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    @property
    def home_collection_price(self):
        return self.walk_in_price * Decimal("1.50")

    @property
    def doctor_referral_price(self):
        return self.walk_in_price * Decimal("2.00")

    def __str__(self):
        return f"{self.laboratory_test.name} - ₹{self.walk_in_price}"

class PackagePrice(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    package = models.OneToOneField(
        Package,
        on_delete=models.CASCADE,
        related_name="pricing",
    )

    walk_in_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def home_collection_price(self):
        return self.walk_in_price * Decimal("1.50")

    @property
    def doctor_referral_price(self):
        return self.walk_in_price * Decimal("2.00")

    def __str__(self):
        return f"{self.package.name} - ₹{self.walk_in_price}"

class OrderedTest(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
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

    order_id = models.CharField(
        max_length=20,
        unique=True,
    )

    visit = models.ForeignKey(
        "visits.Visit",
        on_delete=models.CASCADE,
        related_name="ordered_tests",
    )

    laboratory_test = models.ForeignKey(
        LaboratoryTest,
        on_delete=models.PROTECT,
        related_name="ordered_tests",
    )

    sample = models.ForeignKey(
    "Sample",
    null=True,
    blank=True,
    on_delete=models.SET_NULL,
    related_name="ordered_tests",
    )

    status = models.CharField(
    max_length=20,
    choices=ORDERED_TEST_STATUS_CHOICES,
    default="PENDING",
    )

    remarks = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return f"{self.order_id} - {self.laboratory_test.name}"

class Sample(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    sample_id = models.CharField(
        max_length=20,
        unique=True,
    )

    visit = models.ForeignKey(
        "visits.Visit",
        on_delete=models.CASCADE,
        related_name="samples",
    )

    sample_type = models.CharField(
        max_length=20,
        choices=SAMPLE_TYPE_CHOICES,
    )

    status = models.CharField(
        max_length=20,
        choices=SAMPLE_STATUS_CHOICES,
        default="PENDING",
    )

    collected_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="collected_samples",
    )

    collected_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    remarks = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return f"{self.sample_id} ({self.sample_type})"


class Result(models.Model):

    @property
    def laboratory_test(self):
        return self.ordered_test.laboratory_test

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    result_id = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
    )

    sample = models.ForeignKey(
        Sample,
        on_delete=models.CASCADE,
        related_name="results",
    )

    ordered_test = models.OneToOneField(
        OrderedTest,
        on_delete=models.CASCADE,
        related_name="result",
    )

    status = models.CharField(
        max_length=25,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    remarks = models.TextField(
        blank=True,
    )

    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_results",
    )

    verified_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.result_id} - {self.ordered_test.laboratory_test.name}"

class ResultParameter(models.Model):

    

    class Flag(models.TextChoices):
        NORMAL = "NORMAL", "Normal"
        HIGH = "HIGH", "High"
        LOW = "LOW", "Low"
        NOT_APPLICABLE = "NOT_APPLICABLE", "Not Applicable"


    @property
    def display_value(self):
        if self.flag == self.Flag.HIGH:
            return f"{self.value} ↑"

        if self.flag == self.Flag.LOW:
            return f"{self.value} ↓"

        return self.value

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    result = models.ForeignKey(
        Result,
        on_delete=models.CASCADE,
        related_name="parameters",
    )

    test_parameter = models.ForeignKey(
        TestParameter,
        on_delete=models.PROTECT,
        related_name="result_parameters",
    )


    value = models.CharField(
        max_length=100,
        blank=True,
    )

    reference_range = models.CharField(
            max_length=100,
            blank=True,
        )

    flag = models.CharField(
        max_length=20,
        choices=Flag.choices,
        default=Flag.NOT_APPLICABLE,
    )

    remarks = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )


    class Meta:
        ordering = ["test_parameter__display_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["result", "test_parameter"],
                name="unique_test_parameter_per_result",
            ),
        ]

    def __str__(self):
        return f"{self.result.result_id} - {self.test_parameter.name}"
