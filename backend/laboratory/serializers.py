from rest_framework import serializers

from common.choices import SAMPLE_TYPE_CHOICES
from laboratory.models import OrderedTest, Result, ResultParameter, Sample


class CreateSampleSerializer(serializers.Serializer):
    visit_id = serializers.CharField(max_length=20)
    sample_type = serializers.ChoiceField(choices=SAMPLE_TYPE_CHOICES)
    remarks = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )


class CreateOrderedTestSerializer(serializers.Serializer):
    visit_id = serializers.CharField(max_length=20)
    test_id = serializers.CharField(max_length=20)
    remarks = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )


class CreateResultSerializer(serializers.Serializer):
    order_id = serializers.CharField(max_length=20)


class AssignSampleSerializer(serializers.Serializer):
    sample_id = serializers.CharField(max_length=20)


class UpdateResultParameterSerializer(serializers.Serializer):
    parameter_id = serializers.CharField(max_length=20)
    value = serializers.CharField(max_length=100, trim_whitespace=True)
    remarks = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )


class SubmitResultSerializer(serializers.Serializer):
    remarks = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )


class ApproveResultSerializer(serializers.Serializer):
    remarks = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )


class RejectResultSerializer(serializers.Serializer):
    remarks = serializers.CharField()


class OrderedTestListQuerySerializer(serializers.Serializer):
    search = serializers.CharField(required=False, allow_blank=True)
    patient_id = serializers.CharField(max_length=20, required=False)
    test_id = serializers.CharField(max_length=20, required=False)
    status = serializers.ChoiceField(
        choices=OrderedTest.STATUS_CHOICES,
        required=False,
    )
    created_from = serializers.DateField(required=False)
    created_to = serializers.DateField(required=False)
    ordering = serializers.ChoiceField(
        choices=("created_at", "-created_at", "order_id", "-order_id"),
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


class ResultListQuerySerializer(serializers.Serializer):
    search = serializers.CharField(required=False, allow_blank=True)
    patient_id = serializers.CharField(max_length=20, required=False)
    status = serializers.ChoiceField(choices=Result.Status.choices, required=False)
    created_from = serializers.DateField(required=False)
    created_to = serializers.DateField(required=False)
    ordering = serializers.ChoiceField(
        choices=("created_at", "-created_at", "result_id", "-result_id"),
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


class OrderedTestSerializer(serializers.ModelSerializer):

    test_name = serializers.CharField(
        source="laboratory_test.name",
        read_only=True,
    )

    patient_name = serializers.CharField(
        source="visit.patient.full_name",
        read_only=True,
    )

    class Meta:
        model = OrderedTest
        fields = (
            "order_id",
            "patient_name",
            "test_name",
            "status",
            "remarks",
            "created_at",
        )


class ResultSerializer(serializers.ModelSerializer):

    test_name = serializers.CharField(
        source="ordered_test.laboratory_test.name",
        read_only=True,
    )

    patient_name = serializers.CharField(
        source="ordered_test.visit.patient.full_name",
        read_only=True,
    )

    class Meta:
        model = Result
        fields = (
            "result_id",
            "patient_name",
            "test_name",
            "status",
            "remarks",
            "verified_at",
            "created_at",
        )


class SampleSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(
        source="visit.patient.full_name",
        read_only=True,
    )

    class Meta:
        model = Sample
        fields = (
            "sample_id",
            "patient_name",
            "sample_type",
            "status",
            "remarks",
            "collected_at",
            "created_at",
        )


class ResultParameterSerializer(serializers.ModelSerializer):
    parameter_id = serializers.CharField(
        source="test_parameter.parameter_id",
        read_only=True,
    )
    parameter_name = serializers.CharField(
        source="test_parameter.name",
        read_only=True,
    )
    unit = serializers.CharField(
        source="test_parameter.unit",
        read_only=True,
    )

    class Meta:
        model = ResultParameter
        fields = (
            "parameter_id",
            "parameter_name",
            "value",
            "unit",
            "reference_range",
            "flag",
            "remarks",
        )


class ResultDetailSerializer(ResultSerializer):
    parameters = ResultParameterSerializer(many=True, read_only=True)
    sample_id = serializers.CharField(source="sample.sample_id", read_only=True)
    order_id = serializers.CharField(source="ordered_test.order_id", read_only=True)

    class Meta(ResultSerializer.Meta):
        fields = ResultSerializer.Meta.fields + (
            "sample_id",
            "order_id",
            "parameters",
        )
