from rest_framework import serializers
from django.utils import timezone

from patients.models import Patient


class PatientDateOfBirthValidationMixin:
    def validate_date_of_birth(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value


class CreatePatientSerializer(PatientDateOfBirthValidationMixin, serializers.Serializer):
    full_name = serializers.CharField(max_length=255)

    date_of_birth = serializers.DateField()

    gender = serializers.ChoiceField(
        choices=Patient.GENDER_CHOICES,
    )

    phone = serializers.CharField(max_length=15)

    email = serializers.EmailField(
        required=False,
        allow_blank=True,
        default="",
    )

    address = serializers.CharField()


class UpdatePatientSerializer(PatientDateOfBirthValidationMixin, serializers.Serializer):
    full_name = serializers.CharField(
        max_length=255,
        required=False,
    )

    date_of_birth = serializers.DateField(
        required=False,
    )

    gender = serializers.ChoiceField(
        choices=Patient.GENDER_CHOICES,
        required=False,
    )

    phone = serializers.CharField(
        max_length=15,
        required=False,
    )

    email = serializers.EmailField(
        required=False,
        allow_blank=True,
    )

    address = serializers.CharField(
        required=False,
    )


class PatientSerializer(serializers.ModelSerializer):

    age = serializers.ReadOnlyField()

    gender_display = serializers.ReadOnlyField()

    class Meta:
        model = Patient

        fields = (
            "patient_id",
            "full_name",
            "date_of_birth",
            "age",
            "gender",
            "gender_display",
            "phone",
            "email",
            "address",
            "registered_on",
        )
