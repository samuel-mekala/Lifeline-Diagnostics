from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import PatientPermission
from common.pagination import OptionalPageNumberPagination
from patients.models import Patient
from patients.serializers import (
    CreatePatientSerializer,
    PatientListQuerySerializer,
    PatientSerializer,
    UpdatePatientSerializer,
)
from patients.services import PatientService


class CreatePatientAPIView(APIView):
    permission_classes = [PatientPermission]

    def post(self, request):
        serializer = CreatePatientSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        patient = PatientService.create_patient(
            **serializer.validated_data,
        )

        return Response(
            PatientSerializer(patient).data,
            status=status.HTTP_201_CREATED,
        )


class PatientDetailAPIView(APIView):
    permission_classes = [PatientPermission]

    def get(self, request, patient_id):
        try:
            patient = PatientService.get_patient(patient_id=patient_id)
        except Patient.DoesNotExist:
            return Response(
                {"error": "Patient not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            PatientSerializer(patient).data,
            status=status.HTTP_200_OK,
        )


class UpdatePatientAPIView(APIView):
    permission_classes = [PatientPermission]

    def patch(self, request, patient_id):
        serializer = UpdatePatientSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            patient = PatientService.get_patient(patient_id=patient_id)
        except Patient.DoesNotExist:
            return Response(
                {"error": "Patient not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        patient = PatientService.update_patient(
            patient=patient,
            **serializer.validated_data,
        )

        return Response(
            PatientSerializer(patient).data,
            status=status.HTTP_200_OK,
        )


class PatientListAPIView(APIView):
    permission_classes = [PatientPermission]

    def get(self, request):
        serializer = PatientListQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        patients = PatientService.list_patients(filters=serializer.validated_data)
        return self.paginated_response(request, patients)

    @staticmethod
    def paginated_response(request, patients):
        paginator = OptionalPageNumberPagination()
        page = paginator.paginate_queryset(patients, request)
        if page is not None:
            return paginator.get_paginated_response(
                PatientSerializer(page, many=True).data
            )
        return Response(PatientSerializer(patients, many=True).data)


class PatientSearchAPIView(APIView):
    permission_classes = [PatientPermission]

    def get(self, request):
        serializer = PatientListQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        patients = PatientService.list_patients(filters=serializer.validated_data)
        return PatientListAPIView.paginated_response(request, patients)
