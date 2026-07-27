from unittest.mock import patch

from django.db import DatabaseError
from django.test import TestCase
from rest_framework.exceptions import AuthenticationFailed, NotFound, PermissionDenied, ValidationError
from rest_framework.test import APIRequestFactory

from common.exceptions import custom_exception_handler
from common.services.health import HealthService

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
