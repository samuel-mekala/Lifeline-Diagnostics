from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import VisitPermission
from visits.appointment_serializers import AppointmentSerializer, CreateAppointmentSerializer, RescheduleAppointmentSerializer, UpdateAppointmentStatusSerializer
from visits.appointment_services import AppointmentService
from visits.models import Appointment
from patients.models import Patient, PatientAddress


class AppointmentListAPIView(APIView):
    permission_classes = [VisitPermission]

    def get(self, request):
        return Response(AppointmentSerializer(AppointmentService.list(patient_id=request.query_params.get("patient_id")), many=True).data)

    def post(self, request):
        serializer = CreateAppointmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            appointment = AppointmentService.create(actor=request.user, **serializer.validated_data)
        except (ValueError, Patient.DoesNotExist, PatientAddress.DoesNotExist) as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED)


class AppointmentStatusAPIView(APIView):
    permission_classes = [VisitPermission]

    def patch(self, request, appointment_id):
        serializer = UpdateAppointmentStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            appointment = AppointmentService.get(appointment_id=appointment_id)
            appointment = AppointmentService.update_status(appointment=appointment, actor=request.user, **serializer.validated_data)
        except Appointment.DoesNotExist:
            return Response({"error": "Appointment not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(AppointmentSerializer(appointment).data)


class AppointmentRescheduleAPIView(APIView):
    permission_classes = [VisitPermission]

    def patch(self, request, appointment_id):
        serializer = RescheduleAppointmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            appointment = AppointmentService.reschedule(appointment=AppointmentService.get(appointment_id=appointment_id), actor=request.user, **serializer.validated_data)
        except Appointment.DoesNotExist:
            return Response({"error": "Appointment not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(AppointmentSerializer(appointment).data)
