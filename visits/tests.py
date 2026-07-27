from datetime import date

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from patients.models import Patient
from visits.models import Visit


class VisitPaginationTests(TestCase):
    def test_visit_search_supports_opt_in_pagination(self):
        user = User.objects.create_user(
            email="visit-pagination@example.com",
            full_name="Visit Pagination User",
            password="strong-password-123",
            role=User.Role.RECEPTIONIST,
        )
        patient = Patient.objects.create(
            patient_id="PAT-VISIT-PAGE",
            full_name="Visit Pagination Patient",
            date_of_birth=date(1990, 1, 1),
            gender="F",
            phone="9000000010",
            address="Pagination address",
        )
        for index in range(2):
            Visit.objects.create(
                visit_id=f"VIS-PAGE-{index}",
                patient=patient,
            )
        client = APIClient()
        client.force_authenticate(user)

        response = client.get("/api/visits/search/?q=VIS-PAGE&page=1&page_size=1")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 2)
        self.assertEqual(len(response.data["results"]), 1)
