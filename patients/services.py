from common.services.id_generator import generate_business_id

from .models import Patient


class PatientService:

    @staticmethod
    def create_patient(**data):
        patient = Patient(
            patient_id=generate_business_id(
                model=Patient,
                field="patient_id",
                prefix="PAT",
            ),
            **data,
        )

        patient.save()

        return patient