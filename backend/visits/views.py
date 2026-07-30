from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import VisitPermission
from common.pagination import OptionalPageNumberPagination
from patients.models import Patient
from visits.models import Visit
from visits.serializers import (
    CreateVisitSerializer,
    UpdateVisitSerializer,
    UpdateVisitStatusSerializer,
    VisitListQuerySerializer,
    VisitSerializer,
)
from visits.services import VisitService


class CreateVisitAPIView(APIView):
    permission_classes = [VisitPermission]

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
    permission_classes = [VisitPermission]

    def get(self, request, visit_id):
        try:
            visit = VisitService.get_visit(visit_id=visit_id)
        except Visit.DoesNotExist:
            return Response(
                {"error": "Visit not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            VisitSerializer(visit).data
        )


class UpdateVisitAPIView(APIView):
    permission_classes = [VisitPermission]

    def patch(self, request, visit_id):
        serializer = UpdateVisitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            visit = VisitService.get_visit(visit_id=visit_id)
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
    permission_classes = [VisitPermission]

    def patch(self, request, visit_id):
        serializer = UpdateVisitStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            visit = VisitService.get_visit(visit_id=visit_id)
        except Visit.DoesNotExist:
            return Response(
                {"error": "Visit not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            visit = VisitService.update_status(
                visit=visit,
                status=serializer.validated_data["status"],
            )
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            VisitSerializer(visit).data
        )


class VisitListAPIView(APIView):
    permission_classes = [VisitPermission]

    def get(self, request):
        serializer = VisitListQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        visits = VisitService.list_visits(filters=serializer.validated_data)
        return self.paginated_response(request, visits)

    @staticmethod
    def paginated_response(request, visits):
        paginator = OptionalPageNumberPagination()
        page = paginator.paginate_queryset(visits, request)
        if page is not None:
            return paginator.get_paginated_response(
                VisitSerializer(page, many=True).data
            )
        return Response(VisitSerializer(visits, many=True).data)


class VisitSearchAPIView(APIView):
    permission_classes = [VisitPermission]

    def get(self, request):
        serializer = VisitListQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        visits = VisitService.list_visits(filters=serializer.validated_data)
        return VisitListAPIView.paginated_response(request, visits)
