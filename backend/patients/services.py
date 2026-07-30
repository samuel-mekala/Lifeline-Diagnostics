from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from common.services.id_generator import generate_business_id
from patients.models import Patient


class PatientService:

    @staticmethod
    def get_patient(*, patient_id):
        return Patient.objects.get(patient_id=patient_id)

    @staticmethod
    def list_patients(*, filters):
        search = filters.get("search") or filters.get("q", "")
        patients = Patient.objects.all()
        if search:
            patients = patients.filter(
                Q(patient_id__icontains=search)
                | Q(full_name__icontains=search)
                | Q(phone__icontains=search)
            )
        if gender := filters.get("gender"):
            patients = patients.filter(gender=gender)
        if registered_from := filters.get("registered_from"):
            patients = patients.filter(registered_on__date__gte=registered_from)
        if registered_to := filters.get("registered_to"):
            patients = patients.filter(registered_on__date__lte=registered_to)
        return patients.order_by(filters["ordering"])

    @staticmethod
    @transaction.atomic
    def create_patient(
        *,
        full_name,
        date_of_birth,
        gender,
        phone,
        email="",
        address="",
        linked_user=None,
    ):
        if date_of_birth > timezone.localdate():
            raise ValueError("Date of birth cannot be in the future.")

        # The unique constraint is the final authority under concurrent creates.
        # Retry with a newly generated ID if another request won the same ID.
        return Patient.objects.create(
            patient_id=generate_business_id(
                model=Patient,
                field="patient_id",
                prefix="PAT",
            ),
            full_name=full_name,
            date_of_birth=date_of_birth,
            gender=gender,
            phone=phone,
            email=email,
            address=address,
            linked_user=linked_user,
        )

    @staticmethod
    @transaction.atomic
    def update_patient(
        *,
        patient,
        **data,
    ):
        if (
            "date_of_birth" in data
            and data["date_of_birth"] > timezone.localdate()
        ):
            raise ValueError("Date of birth cannot be in the future.")

        for field, value in data.items():
            setattr(patient, field, value)

        patient.save()

        return patient
