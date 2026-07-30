from datetime import date
from datetime import timedelta
from unittest.mock import Mock, patch

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from patients.models import Patient
from visits.models import Visit
from visits.services import VisitService
from visits.appointment_services import AppointmentService


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


class VisitProductionReadinessTests(TestCase):
    def setUp(self):
        self.patient = Patient.objects.create(
            patient_id="PAT-VISIT-SERVICE", full_name="Visit Patient", date_of_birth=date(1990, 1, 1),
            gender="M", phone="9000000011", address="Address", email="visit@example.com",
        )
        self.visit = Visit.objects.create(visit_id="VIS-SERVICE", patient=self.patient)

    def test_service_retrieves_visit_and_terminal_visits_cannot_transition(self):
        self.assertEqual(VisitService.get_visit(visit_id=self.visit.visit_id), self.visit)
        self.visit.status = "COMPLETED"
        self.visit.save(update_fields=["status"])
        with self.assertRaisesMessage(ValueError, "Completed or cancelled visits cannot change status."):
            VisitService.update_status(visit=self.visit, status="IN_PROGRESS")

    def test_appointment_notification_is_deferred_until_commit(self):
        notification_service = Mock()
        with patch("visits.appointment_services.get_notification_service", return_value=notification_service):
            with self.captureOnCommitCallbacks(execute=False) as callbacks:
                AppointmentService.create(
                    patient_id=self.patient.patient_id,
                    collection_type="LAB",
                    scheduled_for=timezone.now() + timedelta(days=1),
                    payment_preference="PAY_LATER",
                )
                notification_service.booking_confirmation.assert_not_called()
            self.assertEqual(len(callbacks), 1)
            callbacks[0]()
        notification_service.booking_confirmation.assert_called_once()
