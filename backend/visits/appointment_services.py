from django.db import transaction
from django.utils import timezone

from patients.models import Patient, PatientAddress
from visits.models import Appointment
from notifications.services import get_notification_service
from common.services.activity import log_activity


class AppointmentService:
    @staticmethod
    def get(*, appointment_id):
        return Appointment.objects.select_related("patient", "address", "assigned_to").get(id=appointment_id)

    @staticmethod
    @transaction.atomic
    def create(*, patient_id, collection_type, scheduled_for, payment_preference, address_id=None, remarks="", actor=None):
        if scheduled_for <= timezone.now():
            raise ValueError("Appointments must be scheduled in the future.")
        patient = Patient.objects.get(patient_id=patient_id)
        address = None
        if collection_type == Appointment.CollectionType.HOME:
            if not address_id:
                raise ValueError("A home collection address is required.")
            address = PatientAddress.objects.get(id=address_id, patient=patient)
        appointment = Appointment.objects.create(patient=patient, collection_type=collection_type, scheduled_for=scheduled_for, address=address, payment_preference=payment_preference, remarks=remarks)
        if patient.email:
            transaction.on_commit(
                lambda: get_notification_service().booking_confirmation(
                    recipient=patient.email,
                    patient_name=patient.full_name,
                    appointment=scheduled_for.strftime("%d-%b-%Y %I:%M %p"),
                )
            )
        log_activity(actor=actor, action="appointment_created", entity=appointment)
        return appointment

    @staticmethod
    def list(*, patient_id=None):
        appointments = Appointment.objects.select_related("patient", "address", "assigned_to")
        return appointments.filter(patient__patient_id=patient_id) if patient_id else appointments

    @staticmethod
    @transaction.atomic
    def update_status(*, appointment, status, remarks="", actor=None):
        if appointment.status in {Appointment.Status.COMPLETED, Appointment.Status.CANCELLED}:
            raise ValueError("Completed or cancelled appointments cannot be changed.")
        appointment.status = status
        if remarks:
            appointment.remarks = remarks
        appointment.save(update_fields=["status", "remarks", "updated_at"])
        action = "appointment_completed" if appointment.status == Appointment.Status.COMPLETED else "appointment_cancelled" if appointment.status == Appointment.Status.CANCELLED else "appointment_status_updated"
        log_activity(actor=actor, action=action, entity=appointment, metadata={"status": appointment.status})
        return appointment

    @staticmethod
    @transaction.atomic
    def reschedule(*, appointment, scheduled_for, actor=None):
        if appointment.status in {Appointment.Status.COMPLETED, Appointment.Status.CANCELLED}:
            raise ValueError("Completed or cancelled appointments cannot be rescheduled.")
        if scheduled_for <= timezone.now():
            raise ValueError("Appointments must be scheduled in the future.")
        appointment.scheduled_for = scheduled_for
        appointment.save(update_fields=["scheduled_for", "updated_at"])
        log_activity(actor=actor, action="appointment_updated", entity=appointment)
        return appointment
