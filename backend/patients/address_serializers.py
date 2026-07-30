from rest_framework import serializers

from patients.models import PatientAddress


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientAddress
        fields = ("id", "label", "address", "is_default", "created_at")
        read_only_fields = ("id", "created_at")


class CreateAddressSerializer(serializers.Serializer):
    patient_id = serializers.CharField(max_length=20)
    label = serializers.CharField(max_length=50, required=False, default="Home")
    address = serializers.CharField()
    is_default = serializers.BooleanField(required=False, default=False)


class AddressListQuerySerializer(serializers.Serializer):
    patient_id = serializers.CharField(max_length=20)


class UpdateAddressSerializer(serializers.Serializer):
    label = serializers.CharField(max_length=50, required=False)
    address = serializers.CharField(required=False)
    is_default = serializers.BooleanField(required=False)
