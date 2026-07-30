from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from notifications.models import Notification
from notifications.services import get_notification_service
from visits.models import Appointment


class Command(BaseCommand):
    help = "Send one appointment reminder for appointments due within the configured window."

    def add_arguments(self, parser):
        parser.add_argument("--hours", type=int, default=24)

    def handle(self, *args, **options):
        now = timezone.now()
        end = now + timedelta(hours=options["hours"])
        appointments = Appointment.objects.select_related("patient").filter(
            scheduled_for__gte=now,
            scheduled_for__lte=end,
            status__in=[Appointment.Status.BOOKED, Appointment.Status.ACCEPTED],
        )
        service = get_notification_service()
        sent = 0
        for appointment in appointments:
            if not appointment.patient.email:
                continue
            if Notification.objects.filter(category="appointment_reminder", metadata__appointment_id=str(appointment.id)).exists():
                continue
            notification = service.appointment_reminder(
                recipient=appointment.patient.email,
                patient_name=appointment.patient.full_name,
                appointment=appointment.scheduled_for.strftime("%d-%b-%Y %I:%M %p"),
            )
            if notification:
                notification.metadata = {**notification.metadata, "appointment_id": str(appointment.id)}
                notification.save(update_fields=["metadata"])
            sent += 1
        self.stdout.write(self.style.SUCCESS(f"Sent {sent} appointment reminder(s)."))
