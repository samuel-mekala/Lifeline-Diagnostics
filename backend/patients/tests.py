from datetime import date, timedelta

from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from patients.models import Patient, PatientAddress
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


class AddressAPITests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="address-api@example.com",
            full_name="Address API User",
            password="strong-password-123",
            role=User.Role.RECEPTIONIST,
        )
        self.patient = Patient.objects.create(
            patient_id="PAT-ADDRESS-1",
            full_name="Address Patient",
            date_of_birth=date(1990, 1, 1),
            gender="F",
            phone="9000000030",
            address="Legacy address",
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_create_update_and_delete_preserve_default_address(self):
        first = self.client.post(
            "/api/patients/addresses/",
            {"patient_id": self.patient.patient_id, "label": "Home", "address": "First"},
            format="json",
        )
        self.assertEqual(first.status_code, 201)
        self.assertTrue(first.data["is_default"])

        second = self.client.post(
            "/api/patients/addresses/",
            {
                "patient_id": self.patient.patient_id,
                "label": "Work",
                "address": "Second",
                "is_default": True,
            },
            format="json",
        )
        self.assertEqual(second.status_code, 201)
        self.assertTrue(second.data["is_default"])
        self.assertEqual(
            PatientAddress.objects.filter(patient=self.patient, is_default=True).count(),
            1,
        )

        response = self.client.patch(
            f"/api/patients/addresses/{first.data['id']}/",
            {"is_default": True},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["is_default"])
        self.assertEqual(
            PatientAddress.objects.filter(patient=self.patient, is_default=True).count(),
            1,
        )

        response = self.client.patch(
            f"/api/patients/addresses/{first.data['id']}/",
            {"is_default": False},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

        response = self.client.delete(f"/api/patients/addresses/{first.data['id']}/")
        self.assertEqual(response.status_code, 204)
        self.assertTrue(
            PatientAddress.objects.get(id=second.data["id"]).is_default,
        )

    def test_database_allows_only_one_default_address_per_patient(self):
        PatientAddress.objects.create(
            patient=self.patient,
            label="Home",
            address="First",
            is_default=True,
        )
        with self.assertRaises(IntegrityError), transaction.atomic():
            PatientAddress.objects.create(
                patient=self.patient,
                label="Work",
                address="Second",
                is_default=True,
            )

    def test_address_list_requires_an_existing_patient(self):
        self.assertEqual(self.client.get("/api/patients/addresses/").status_code, 400)
        self.assertEqual(
            self.client.get("/api/patients/addresses/?patient_id=PAT-MISSING").status_code,
            404,
        )

    def test_patient_and_address_detail_missing_resources_return_404(self):
        self.assertEqual(self.client.get("/api/patients/PAT-MISSING/").status_code, 404)
        self.assertEqual(
            self.client.patch(
                "/api/patients/addresses/00000000-0000-0000-0000-000000000000/",
                {"label": "Missing"},
                format="json",
            ).status_code,
            404,
        )
