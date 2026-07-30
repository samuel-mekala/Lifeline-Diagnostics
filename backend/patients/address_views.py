from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import PatientPermission
from patients.address_serializers import (
    AddressListQuerySerializer,
    AddressSerializer,
    CreateAddressSerializer,
    UpdateAddressSerializer,
)
from patients.address_services import AddressService
from patients.models import Patient, PatientAddress
from patients.services import PatientService


class AddressListAPIView(APIView):
    permission_classes = [PatientPermission]

    def get(self, request):
        serializer = AddressListQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        try:
            PatientService.get_patient(patient_id=serializer.validated_data["patient_id"])
        except Patient.DoesNotExist:
            return Response({"error": "Patient not found."}, status=status.HTTP_404_NOT_FOUND)
        addresses = AddressService.list(patient_id=serializer.validated_data["patient_id"])
        return Response(AddressSerializer(addresses, many=True).data)

    def post(self, request):
        serializer = CreateAddressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            address = AddressService.create(**serializer.validated_data)
        except Patient.DoesNotExist:
            return Response({"error": "Patient not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(AddressSerializer(address).data, status=status.HTTP_201_CREATED)


class AddressDetailAPIView(APIView):
    permission_classes = [PatientPermission]

    def patch(self, request, address_id):
        serializer = UpdateAddressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            address = AddressService.update(address=AddressService.get(address_id=address_id), **serializer.validated_data)
        except PatientAddress.DoesNotExist:
            return Response({"error": "Address not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as error:
            return Response({"error": str(error)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(AddressSerializer(address).data)

    def delete(self, request, address_id):
        try:
            AddressService.delete(address=AddressService.get(address_id=address_id))
        except PatientAddress.DoesNotExist:
            return Response({"error": "Address not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
