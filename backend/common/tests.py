from unittest.mock import patch

from django.db import DatabaseError
from django.test import TestCase
from rest_framework.exceptions import AuthenticationFailed, NotFound, PermissionDenied, ValidationError
from rest_framework.test import APIRequestFactory

from common.exceptions import custom_exception_handler
from common.services.health import HealthService
from common.services.activity import AUDIT_ACTIONS, log_activity
from common.services.id_generator import generate_business_id
from common.models import ActivityLog
from accounts.models import User
from rest_framework.test import APIClient

class HealthEndpointTests(TestCase):
    def test_health_endpoint_reports_database_connectivity(self):
        response = self.client.get("/health/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"status": "healthy", "database": "ok", "version": "1.0.0"},
        )

    @patch("common.views.HealthService.get_status")
    def test_health_endpoint_reports_database_unavailability(self, get_status):
        get_status.return_value = (
            {"status": "unhealthy", "database": "unavailable", "version": "1.0.0"},
            False,
        )
        response = self.client.get("/health/")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["status"], "unhealthy")

    @patch("common.services.health.connection.ensure_connection", side_effect=DatabaseError)
    def test_health_service_detects_database_unavailability(self, ensure_connection):
        health_status, is_healthy = HealthService.get_status()

        self.assertFalse(is_healthy)
        self.assertEqual(health_status["database"], "unavailable")


class ExceptionHandlerTests(TestCase):
    def setUp(self):
        self.context = {"request": APIRequestFactory().get("/")}

    def test_validation_errors_use_the_standard_error_envelope(self):
        response = custom_exception_handler(
            ValidationError({"amount": ["Must be greater than zero."]}),
            self.context,
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["success"], False)
        self.assertEqual(response.data["error"]["type"], "validation_error")
        self.assertEqual(
            response.data["error"]["message"],
            "amount: Must be greater than zero.",
        )

    def test_not_found_errors_preserve_the_status_code(self):
        response = custom_exception_handler(NotFound("Patient not found."), self.context)

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data["success"], False)
        self.assertEqual(response.data["error"]["type"], "not_found")
        self.assertEqual(response.data["error"]["message"], "Patient not found.")

    def test_permission_and_authentication_errors_have_specific_types(self):
        permission_response = custom_exception_handler(
            PermissionDenied("Permission denied."),
            self.context,
        )
        authentication_response = custom_exception_handler(
            AuthenticationFailed("Invalid token."),
            self.context,
        )

        self.assertEqual(permission_response.status_code, 403)
        self.assertEqual(permission_response.data["error"]["type"], "permission_denied")
        self.assertEqual(authentication_response.status_code, 401)
        self.assertEqual(
            authentication_response.data["error"]["type"],
            "authentication_failed",
        )

    @patch("common.exceptions.logger.error")
    def test_unhandled_errors_are_returned_as_safe_server_errors(self, log_error):
        response = custom_exception_handler(RuntimeError("Unexpected failure."), self.context)

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.data["success"], False)
        self.assertEqual(response.data["error"]["type"], "server_error")
        self.assertEqual(
            response.data["error"]["message"],
            "An unexpected server error occurred.",
        )
        log_error.assert_called_once()


class Sprint20ActivityAndProductionTests(TestCase):
    def test_activity_filter_metadata_returns_supported_actions_and_users(self):
        user = User.objects.create_user(email="owner@example.com", full_name="Owner", password="strong-password-123", role=User.Role.OWNER)
        client = APIClient(); client.force_authenticate(user)
        response = client.get("/api/activity-logs/filters/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("login", response.data["actions"])
        self.assertIn(str(user.id), [str(item["id"]) for item in response.data["users"]])

    def test_production_security_configuration_is_declared(self):
        from django.conf import settings
        self.assertTrue(hasattr(settings, "SECURE_SSL_REDIRECT"))
        self.assertTrue(hasattr(settings, "CORS_ALLOWED_ORIGINS"))
        self.assertTrue(hasattr(settings, "CSRF_TRUSTED_ORIGINS"))

    def test_activity_logs_without_an_actor_and_privileged_access_are_supported(self):
        ActivityLog.objects.create(actor=None, action="system_event")
        owner = User.objects.create_user(email="logs-owner@example.com", full_name="Owner", password="strong-password-123", role=User.Role.OWNER)
        patient = User.objects.create_user(email="logs-patient@example.com", full_name="Patient", password="strong-password-123", role=User.Role.PATIENT)
        client = APIClient(); client.force_authenticate(owner)
        self.assertIsNone(client.get("/api/activity-logs/").data[0]["actor_name"])
        client.force_authenticate(patient)
        self.assertEqual(client.get("/api/activity-logs/").status_code, 403)

    def test_business_id_generation_uses_a_monotonic_sequence(self):
        first = generate_business_id(User, "email", "USR")
        second = generate_business_id(User, "email", "USR")
        self.assertEqual((first, second), ("USR000001", "USR000002"))
