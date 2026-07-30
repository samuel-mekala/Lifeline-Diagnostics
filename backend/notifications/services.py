"""Notification delivery with an auditable, SMTP-backed default channel."""

from abc import ABC, abstractmethod
import logging

from django.conf import settings
from django.core.mail import send_mail
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from notifications.models import Notification

logger = logging.getLogger("lifeline")


class NotificationService(ABC):
    @abstractmethod
    def send(self, *, recipient, category, message, metadata=None):
        """Deliver an appointment, report, billing, collection, or payment notice."""

    def booking_confirmation(self, *, recipient, patient_name, appointment):
        return self.send_template(recipient=recipient, category="booking_confirmation", context={"patient_name": patient_name, "appointment": appointment})

    def appointment_reminder(self, *, recipient, patient_name, appointment):
        return self.send_template(recipient=recipient, category="appointment_reminder", context={"patient_name": patient_name, "appointment": appointment})

    def report_ready(self, *, recipient, patient_name, report_id):
        return self.send_template(recipient=recipient, category="report_ready", context={"patient_name": patient_name, "report_id": report_id})

    def payment_confirmation(self, *, recipient, patient_name, invoice_id, amount):
        return self.send_template(recipient=recipient, category="payment_confirmation", context={"patient_name": patient_name, "invoice_id": invoice_id, "amount": amount})

    def password_reset(self, *, recipient, code):
        return self.send_template(recipient=recipient, category="password_reset", context={"code": code})

    def send_template(self, *, recipient, category, context):
        raise NotImplementedError


class NullNotificationService(NotificationService):
    """Explicit no-op default for deployments with no configured channel."""

    def send(self, *, recipient, category, message, metadata=None):
        return None

    def send_template(self, *, recipient, category, context):
        return None


class EmailNotificationService(NotificationService):
    TEMPLATE_COPY = {
        "booking_confirmation": ("Your booking is confirmed", "Your appointment is confirmed.", "Appointment: {appointment}"),
        "appointment_reminder": ("Appointment reminder", "This is a reminder for your upcoming appointment.", "Appointment: {appointment}"),
        "report_ready": ("Your report is ready", "Your laboratory report is now ready.", "Report ID: {report_id}"),
        "payment_confirmation": ("Payment received", "We have received your payment.", "Invoice: {invoice_id}; Amount: {amount}"),
        "password_reset": ("Password reset code", "Use the following verification code to reset your password.", "Code: {code}"),
    }

    def send_template(self, *, recipient, category, context):
        subject, message, details = self.TEMPLATE_COPY[category]
        context = {**context, "greeting": f"Hello {context.get('patient_name', 'there')},", "message": message, "details": details.format(**context)}
        text_body = render_to_string("notifications/email.txt", context)
        html_body = render_to_string("notifications/email.html", context)
        audit_context = context
        audit_text_body = text_body
        if category == "password_reset":
            audit_context = {**context, "code": "[REDACTED]", "details": "Code: [REDACTED]"}
            audit_text_body = render_to_string("notifications/email.txt", audit_context)
        return self._deliver(
            recipient=recipient, category=category, subject=subject, text_body=text_body,
            html_body=html_body, metadata=audit_context, audit_message=audit_text_body,
        )

    def send(self, *, recipient, category, message, metadata=None):
        return self._deliver(recipient=recipient, category=category, subject=f"Lifeline Diagnostics: {category.replace('_', ' ').title()}", text_body=message, html_body=None, metadata=metadata)

    def _deliver(self, *, recipient, category, subject, text_body, html_body, metadata, audit_message=None):
        notification = Notification.objects.create(
            recipient=recipient,
            category=category,
            message=audit_message if audit_message is not None else text_body,
            metadata=metadata or {},
            status=Notification.Status.SKIPPED,
        )
        if not recipient:
            return notification
        try:
            email = EmailMultiAlternatives(
                subject=subject, body=text_body, from_email=settings.DEFAULT_FROM_EMAIL, to=[recipient]
            )
            if html_body: email.attach_alternative(html_body, "text/html")
            email.send(fail_silently=False)
        except Exception as exc:  # Delivery failures are recorded without breaking clinical workflows.
            logger.exception("Notification delivery failed", extra={"category": category})
            notification.status = Notification.Status.FAILED
            notification.error = str(exc)
            notification.save(update_fields=["status", "error"])
            return notification
        notification.status = Notification.Status.SENT
        notification.save(update_fields=["status"])
        return notification


def get_notification_service():
    if getattr(settings, "NOTIFICATION_EMAIL_ENABLED", False):
        return EmailNotificationService()
    return NullNotificationService()
