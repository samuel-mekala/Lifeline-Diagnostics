from rest_framework import serializers

from reports.models import Report


class ReportListQuerySerializer(serializers.Serializer):
    search = serializers.CharField(required=False, allow_blank=True)
    patient_id = serializers.CharField(max_length=20, required=False)
    status = serializers.ChoiceField(choices=Report.Status.choices, required=False)
    generated_from = serializers.DateField(required=False)
    generated_to = serializers.DateField(required=False)
    ordering = serializers.ChoiceField(
        choices=("generated_at", "-generated_at", "created_at", "-created_at"),
        required=False,
        default="-generated_at",
    )

    def validate(self, attrs):
        if attrs.get("generated_from") and attrs.get("generated_to"):
            if attrs["generated_from"] > attrs["generated_to"]:
                raise serializers.ValidationError(
                    "generated_from cannot be after generated_to."
                )
        return attrs


class ReportSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="visit.patient.full_name", read_only=True)
    patient_id = serializers.CharField(source="visit.patient.patient_id", read_only=True)
    visit_id = serializers.CharField(source="visit.visit_id", read_only=True)

    class Meta:
        model = Report
        fields = (
            "report_id",
            "patient_id",
            "patient_name",
            "visit_id",
            "status",
            "generated_at",
            "created_at",
        )
