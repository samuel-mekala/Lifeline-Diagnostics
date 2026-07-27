from rest_framework import serializers

from visits.models import Visit


class CreateVisitSerializer(serializers.Serializer):

    patient_id = serializers.CharField()

    entry_mode = serializers.ChoiceField(
        choices=Visit.EntryMode.choices,
        default=Visit.EntryMode.WALK_IN,
    )

    remarks = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )


class UpdateVisitSerializer(serializers.Serializer):

    remarks = serializers.CharField(
        required=False,
    )


class UpdateVisitStatusSerializer(serializers.Serializer):

    status = serializers.ChoiceField(
        choices=Visit.STATUS_CHOICES,
    )


class VisitSerializer(serializers.ModelSerializer):

    patient_id = serializers.CharField(
        source="patient.patient_id",
        read_only=True,
    )

    patient_name = serializers.CharField(
        source="patient.full_name",
        read_only=True,
    )

    class Meta:
        model = Visit

        fields = (
            "visit_id",
            "patient_id",
            "patient_name",
            "entry_mode",
            "status",
            "remarks",
            "created_at",
        )
