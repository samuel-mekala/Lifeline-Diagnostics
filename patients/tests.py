from datetime import date, timedelta

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from patients.models import Patient
from patients.serializers import CreatePatientSerializer
from patients.services import PatientService


class PatientPaginationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="patient-pagination@example.com",
            full_name="Patient Pagination User",
            password="strong-password-123",
            role=User.Role.RECEPTIONIST,
        )
        for index in range(2):
            Patient.objects.create(
                patient_id=f"PAT-PAGE-{index}",
                full_name=f"Pagination Patient {index}",
                date_of_birth=date(1990, 1, 1),
                gender="M",
                phone=f"900000000{index}",
                address="Pagination address",
            )

    def test_patient_list_paginates_only_when_requested(self):
        client = APIClient()
        client.force_authenticate(self.user)

        legacy_response = client.get("/api/patients/list/")
        paginated_response = client.get("/api/patients/list/?page=1&page_size=1")

        self.assertIsInstance(legacy_response.data, list)
        self.assertEqual(paginated_response.status_code, 200)
        self.assertEqual(paginated_response.data["count"], 2)
        self.assertEqual(len(paginated_response.data["results"]), 1)

    def test_future_date_of_birth_is_rejected_by_serializer_and_service(self):
        future_date = date.today() + timedelta(days=1)
        serializer = CreatePatientSerializer(
            data={
                "full_name": "Future Patient",
                "date_of_birth": future_date.isoformat(),
                "gender": "M",
                "phone": "9000000020",
                "address": "Validation address",
            }
        )

        self.assertFalse(serializer.is_valid())
        with self.assertRaisesMessage(
            ValueError,
            "Date of birth cannot be in the future.",
        ):
            PatientService.create_patient(
                full_name="Future Patient",
                date_of_birth=future_date,
                gender="M",
                phone="9000000020",
                address="Validation address",
            )
