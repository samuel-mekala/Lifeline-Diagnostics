from rest_framework import serializers

from laboratory.models import OrderedTest, Result, ResultParameter, Sample


class CreateSampleSerializer(serializers.Serializer):
    visit_id = serializers.CharField()
    sample_type = serializers.CharField()
    remarks = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )


class CreateOrderedTestSerializer(serializers.Serializer):
    visit_id = serializers.CharField()
    test_id = serializers.CharField()
    remarks = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )


class CreateResultSerializer(serializers.Serializer):
    order_id = serializers.CharField()


class AssignSampleSerializer(serializers.Serializer):
    sample_id = serializers.CharField()


class UpdateResultParameterSerializer(serializers.Serializer):
    parameter_id = serializers.CharField()
    value = serializers.CharField()
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
