from django.db.models import Q

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from patients.models import Patient
from visits.models import Visit
from visits.serializers import (
    CreateVisitSerializer,
    UpdateVisitSerializer,
    UpdateVisitStatusSerializer,
    VisitSerializer,
)
from visits.services import VisitService


class CreateVisitAPIView(APIView):

    def post(self, request):
        serializer = CreateVisitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            patient = Patient.objects.get(
                patient_id=serializer.validated_data["patient_id"]
            )
        except Patient.DoesNotExist:
            return Response(
                {"error": "Patient not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        visit = VisitService.create_visit(
            patient=patient,
            entry_mode=serializer.validated_data["entry_mode"],
            remarks=serializer.validated_data["remarks"],
        )

        return Response(
            VisitSerializer(visit).data,
            status=status.HTTP_201_CREATED,
        )


class VisitDetailAPIView(APIView):

    def get(self, request, visit_id):
        try:
            visit = Visit.objects.get(visit_id=visit_id)
        except Visit.DoesNotExist:
            return Response(
                {"error": "Visit not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            VisitSerializer(visit).data
        )


class UpdateVisitAPIView(APIView):

    def patch(self, request, visit_id):
        serializer = UpdateVisitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            visit = Visit.objects.get(visit_id=visit_id)
        except Visit.DoesNotExist:
            return Response(
                {"error": "Visit not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        visit = VisitService.update_visit(
            visit=visit,
            **serializer.validated_data,
        )

        return Response(
            VisitSerializer(visit).data
        )


class UpdateVisitStatusAPIView(APIView):

    def patch(self, request, visit_id):
        serializer = UpdateVisitStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            visit = Visit.objects.get(visit_id=visit_id)
        except Visit.DoesNotExist:
            return Response(
                {"error": "Visit not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        visit = VisitService.update_status(
            visit=visit,
            status=serializer.validated_data["status"],
        )

        return Response(
            VisitSerializer(visit).data
        )


class VisitListAPIView(APIView):

    def get(self, request):
        visits = Visit.objects.select_related(
            "patient"
        ).order_by("-created_at")

        serializer = VisitSerializer(
            visits,
            many=True,
        )

        return Response(serializer.data)


class VisitSearchAPIView(APIView):

    def get(self, request):
        query = request.GET.get("q", "").strip()

        visits = Visit.objects.select_related("patient").filter(
            Q(visit_id__icontains=query)
            | Q(patient__patient_id__icontains=query)
            | Q(patient__full_name__icontains=query)
        ).order_by("-created_at")

        serializer = VisitSerializer(
            visits,
            many=True,
        )

        return Response(serializer.data)
