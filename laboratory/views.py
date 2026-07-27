from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import (
    LaboratoryTechnicianPermission,
    PathologistPermission,
    ResultReviewPermission,
)
from laboratory.models import OrderedTest, Result, ResultParameter
from laboratory.serializers import (
    ApproveResultSerializer,
    AssignSampleSerializer,
    CreateOrderedTestSerializer,
    CreateResultSerializer,
    CreateSampleSerializer,
    OrderedTestSerializer,
    RejectResultSerializer,
    ResultDetailSerializer,
    ResultSerializer,
    SampleSerializer,
    SubmitResultSerializer,
    UpdateResultParameterSerializer,
)
from laboratory.services import (
    OrderedTestService,
    ResultApprovalService,
    ResultEntryService,
    ResultService,
    SampleService,
)


def error_response(message, http_status=status.HTTP_400_BAD_REQUEST):
    return Response({"error": message}, status=http_status)


class CreateSampleAPIView(APIView):
    permission_classes = [LaboratoryTechnicianPermission]
    def post(self, request):
        serializer = CreateSampleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            sample = SampleService.create_sample(**serializer.validated_data)
        except Exception as exc:
            return error_response(str(exc))

        return Response(SampleSerializer(sample).data, status=status.HTTP_201_CREATED)


class CreateOrderedTestAPIView(APIView):
    permission_classes = [LaboratoryTechnicianPermission]
    def post(self, request):
        serializer = CreateOrderedTestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            ordered_test = OrderedTestService.create_ordered_test(
                **serializer.validated_data
            )
        except Exception as exc:
            return error_response(str(exc))

        return Response(
            OrderedTestSerializer(ordered_test).data,
            status=status.HTTP_201_CREATED,
        )


class AssignSampleAPIView(APIView):
    permission_classes = [LaboratoryTechnicianPermission]
    def post(self, request, order_id):
        serializer = AssignSampleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            ordered_test = OrderedTestService.assign_sample(
                order_id=order_id,
                sample_id=serializer.validated_data["sample_id"],
            )
        except ValueError as exc:
            http_status = (
                status.HTTP_404_NOT_FOUND
                if str(exc) in {"Ordered test not found.", "Sample not found."}
                else status.HTTP_400_BAD_REQUEST
            )
            return error_response(str(exc), http_status)

        return Response(OrderedTestSerializer(ordered_test).data)


class CreateResultAPIView(APIView):
    permission_classes = [LaboratoryTechnicianPermission]
    def post(self, request):
        serializer = CreateResultSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = ResultService.create_result(**serializer.validated_data)
        except OrderedTest.DoesNotExist:
            return error_response("Ordered test not found.", status.HTTP_404_NOT_FOUND)
        except ValueError as exc:
            return error_response(str(exc))
        except Exception as exc:
            return error_response(str(exc))

        return Response(
            ResultDetailSerializer(result).data,
            status=status.HTTP_201_CREATED,
        )


class UpdateResultParameterAPIView(APIView):
    permission_classes = [LaboratoryTechnicianPermission]
    def patch(self, request, result_id):
        serializer = UpdateResultParameterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = Result.objects.get(result_id=result_id)
            result_parameter = ResultParameter.objects.get(
                result=result,
                test_parameter__parameter_id=serializer.validated_data["parameter_id"],
            )
        except Result.DoesNotExist:
            return error_response("Result not found.", status.HTTP_404_NOT_FOUND)
        except ResultParameter.DoesNotExist:
            return error_response("Result parameter not found.", status.HTTP_404_NOT_FOUND)

        result_parameter = ResultEntryService.update_parameter(
            result_parameter=result_parameter,
            value=serializer.validated_data["value"],
            remarks=serializer.validated_data["remarks"],
        )
        return Response({
            "parameter_id": result_parameter.test_parameter.parameter_id,
            "value": result_parameter.value,
            "flag": result_parameter.flag,
            "remarks": result_parameter.remarks,
        })


class SubmitResultAPIView(APIView):
    permission_classes = [LaboratoryTechnicianPermission]
    def post(self, request, result_id):
        serializer = SubmitResultSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = Result.objects.get(result_id=result_id)
        except Result.DoesNotExist:
            return error_response("Result not found.", status.HTTP_404_NOT_FOUND)

        result.remarks = serializer.validated_data["remarks"]
        result.save(update_fields=["remarks", "updated_at"])

        try:
            result = ResultApprovalService.submit_for_approval(result)
        except ValueError as exc:
            return error_response(str(exc))

        return Response(ResultSerializer(result).data)


class ApproveResultAPIView(APIView):
    permission_classes = [PathologistPermission]
    def post(self, request, result_id):
        serializer = ApproveResultSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = Result.objects.get(result_id=result_id)
        except Result.DoesNotExist:
            return error_response("Result not found.", status.HTTP_404_NOT_FOUND)

        result.remarks = serializer.validated_data["remarks"]
        result.save(update_fields=["remarks", "updated_at"])

        try:
            result = ResultApprovalService.approve_result(
                result=result,
                verified_by=request.user if request.user.is_authenticated else None,
            )
        except ValueError as exc:
            return error_response(str(exc))

        return Response(ResultSerializer(result).data)


class RejectResultAPIView(APIView):
    permission_classes = [PathologistPermission]
    def post(self, request, result_id):
        serializer = RejectResultSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = Result.objects.get(result_id=result_id)
        except Result.DoesNotExist:
            return error_response("Result not found.", status.HTTP_404_NOT_FOUND)

        result.remarks = serializer.validated_data["remarks"]
        result.save(update_fields=["remarks", "updated_at"])
        result = ResultApprovalService.reject_result(result=result)
        return Response(ResultSerializer(result).data)


class PendingOrderedTestsAPIView(APIView):
    permission_classes = [LaboratoryTechnicianPermission]
    def get(self, request):
        ordered_tests = OrderedTest.objects.filter(
            status__in=["PENDING", "SAMPLE_COLLECTED", "IN_PROGRESS"],
        ).select_related("visit__patient", "laboratory_test")
        return Response(OrderedTestSerializer(ordered_tests, many=True).data)


class PendingResultsAPIView(APIView):
    permission_classes = [PathologistPermission]
    def get(self, request):
        results = Result.objects.filter(
            status=Result.Status.PENDING_APPROVAL,
        ).select_related("ordered_test__visit__patient", "ordered_test__laboratory_test")
        return Response(ResultSerializer(results, many=True).data)


class ResultDetailAPIView(APIView):
    permission_classes = [ResultReviewPermission]
    def get(self, request, result_id):
        try:
            result = Result.objects.select_related(
                "sample",
                "ordered_test__visit__patient",
                "ordered_test__laboratory_test",
            ).prefetch_related("parameters__test_parameter").get(result_id=result_id)
        except Result.DoesNotExist:
            return error_response("Result not found.", status.HTTP_404_NOT_FOUND)

        return Response(ResultDetailSerializer(result).data)
