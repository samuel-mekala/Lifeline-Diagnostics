from rest_framework import serializers

from visits.models import Appointment


class CreateAppointmentSerializer(serializers.Serializer):
    patient_id = serializers.CharField(max_length=20)
    collection_type = serializers.ChoiceField(choices=Appointment.CollectionType.choices)
    scheduled_for = serializers.DateTimeField()
    address_id = serializers.UUIDField(required=False, allow_null=True)
    payment_preference = serializers.ChoiceField(choices=(("PAY_NOW", "Pay Now"), ("PAY_LATER", "Pay Later")))
    remarks = serializers.CharField(required=False, allow_blank=True, default="")


class UpdateAppointmentStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Appointment.Status.choices)
    remarks = serializers.CharField(required=False, allow_blank=True, default="")


class RescheduleAppointmentSerializer(serializers.Serializer):
    scheduled_for = serializers.DateTimeField()


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    address = serializers.CharField(source="address.address", read_only=True)

    class Meta:
        model = Appointment
        fields = ("id", "patient_id", "patient_name", "collection_type", "scheduled_for", "address", "status", "payment_preference", "remarks", "created_at")
