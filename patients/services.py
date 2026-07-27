from django.db import transaction

from common.services.id_generator import generate_business_id
from patients.models import Patient


class PatientService:

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
        for field, value in data.items():
            setattr(patient, field, value)

        patient.save()

        return patient