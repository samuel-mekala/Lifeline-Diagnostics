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


class VisitListQuerySerializer(serializers.Serializer):
    search = serializers.CharField(required=False, allow_blank=True)
    q = serializers.CharField(required=False, allow_blank=True)
    patient_id = serializers.CharField(max_length=20, required=False)
    status = serializers.ChoiceField(choices=Visit.STATUS_CHOICES, required=False)
    entry_mode = serializers.ChoiceField(choices=Visit.EntryMode.choices, required=False)
    created_from = serializers.DateField(required=False)
    created_to = serializers.DateField(required=False)
    ordering = serializers.ChoiceField(
        choices=("created_at", "-created_at", "visit_id", "-visit_id"),
        required=False,
        default="-created_at",
    )

    def validate(self, attrs):
        if attrs.get("created_from") and attrs.get("created_to"):
            if attrs["created_from"] > attrs["created_to"]:
                raise serializers.ValidationError(
                    "created_from cannot be after created_to."
                )
        return attrs


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
