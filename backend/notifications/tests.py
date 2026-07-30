from unittest.mock import patch
from django.test import TestCase, override_settings
from notifications.models import Notification
from notifications.services import EmailNotificationService
from django.core.management import call_command
from django.utils import timezone
from datetime import timedelta
from patients.models import Patient
from visits.models import Appointment
from laboratory.models import LaboratoryTest, OrderedTest, Result, Sample
from laboratory.services import LaboratoryTestService
from reports.services import ReportService
from reports.models import Report
from visits.models import Visit

class NotificationServiceTests(TestCase):
    @override_settings(NOTIFICATION_EMAIL_ENABLED=True)
    @patch("notifications.services.EmailMultiAlternatives.send")
    def test_html_template_notification_is_logged(self, send):
        EmailNotificationService().payment_confirmation(recipient="patient@example.com", patient_name="Patient", invoice_id="INV-1", amount="100.00")
        self.assertTrue(send.called); self.assertEqual(Notification.objects.get().status, "SENT")

    @override_settings(NOTIFICATION_EMAIL_ENABLED=True)
    @patch("notifications.services.EmailMultiAlternatives.send")
    def test_reminder_command_sends_for_upcoming_appointment(self, send):
        patient = Patient.objects.create(patient_id="PAT-REM-1", full_name="Reminder Patient", date_of_birth="1990-01-01", gender="M", phone="1234567890", email="reminder@example.com", address="Address")
        Appointment.objects.create(patient=patient, collection_type="LAB", scheduled_for=timezone.now() + timedelta(hours=2))
        call_command("send_appointment_reminders")
        self.assertTrue(send.called)

    @override_settings(NOTIFICATION_EMAIL_ENABLED=True)
    @patch("notifications.services.EmailMultiAlternatives.send")
    def test_password_reset_notification_audit_data_redacts_the_otp(self, send):
        EmailNotificationService().password_reset(recipient="patient@example.com", code="123456")
        notification = Notification.objects.get()
        self.assertNotIn("123456", notification.message)
        self.assertNotIn("123456", str(notification.metadata))
        self.assertIn("[REDACTED]", notification.message)

    @override_settings(NOTIFICATION_EMAIL_ENABLED=True)
    @patch("notifications.services.EmailMultiAlternatives.send")
    def test_report_generation_sends_report_ready_notification(self, send):
        patient = Patient.objects.create(patient_id="PAT-REPORT-NOTIFY", full_name="Report Patient", date_of_birth="1990-01-01", gender="M", phone="1234567890", email="report@example.com", address="Address")
        visit = Visit.objects.create(visit_id="VIS-REPORT-NOTIFY", patient=patient)
        sample = Sample.objects.create(sample_id="SAM-REPORT-NOTIFY", visit=visit, sample_type="BLOOD", status="COLLECTED")
        test = LaboratoryTestService.create_test(name="Report Notify Test", category="BIOCHEMISTRY", sample_type="BLOOD")
        order = OrderedTest.objects.create(order_id="ORD-REPORT-NOTIFY", visit=visit, laboratory_test=test, sample=sample, status="SAMPLE_COLLECTED")
        Result.objects.create(result_id="RES-REPORT-NOTIFY", sample=sample, ordered_test=order, status=Result.Status.APPROVED)
        ReportService.get_report_data(visit)
        self.assertTrue(send.called)

    @override_settings(NOTIFICATION_EMAIL_ENABLED=True)
    @patch("notifications.services.EmailMultiAlternatives.send")
    def test_report_ready_notification_is_sent_once_on_generated_transition(self, send):
        patient = Patient.objects.create(patient_id="PAT-REPORT-ONCE", full_name="Report Patient", date_of_birth="1990-01-01", gender="M", phone="1234567890", email="report-once@example.com", address="Address")
        visit = Visit.objects.create(visit_id="VIS-REPORT-ONCE", patient=patient)
        sample = Sample.objects.create(sample_id="SAM-REPORT-ONCE", visit=visit, sample_type="BLOOD", status="COLLECTED")
        test = LaboratoryTestService.create_test(name="Report Once Test", category="BIOCHEMISTRY", sample_type="BLOOD")
        order = OrderedTest.objects.create(order_id="ORD-REPORT-ONCE", visit=visit, laboratory_test=test, sample=sample, status="SAMPLE_COLLECTED")
        Result.objects.create(result_id="RES-REPORT-ONCE", sample=sample, ordered_test=order, status=Result.Status.APPROVED)
        Report.objects.create(visit=visit)

        ReportService.get_report_data(visit)
        ReportService.get_report_data(visit)

        self.assertEqual(send.call_count, 1)
