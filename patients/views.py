from django.db.models import Q

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from patients.models import Patient
from patients.serializers import (
    CreatePatientSerializer,
    PatientSerializer,
    UpdatePatientSerializer,
)
from patients.services import PatientService


class CreatePatientAPIView(APIView):

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

    def get(self, request, patient_id):
        try:
            patient = Patient.objects.get(patient_id=patient_id)
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

    def patch(self, request, patient_id):
        serializer = UpdatePatientSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            patient = Patient.objects.get(patient_id=patient_id)
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

    def get(self, request):
        patients = Patient.objects.all().order_by("-registered_on")

        serializer = PatientSerializer(
            patients,
            many=True,
        )

        return Response(serializer.data)


class PatientSearchAPIView(APIView):

    def get(self, request):
        query = request.GET.get("q", "").strip()

        patients = Patient.objects.filter(
            Q(patient_id__icontains=query)
            | Q(full_name__icontains=query)
            | Q(phone__icontains=query)
        ).order_by("-registered_on")

        serializer = PatientSerializer(
            patients,
            many=True,
        )

        return Response(serializer.data)
