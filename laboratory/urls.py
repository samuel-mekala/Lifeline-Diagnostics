from django.urls import path

from laboratory.views import (
    ApproveResultAPIView,
    AssignSampleAPIView,
    CreateOrderedTestAPIView,
    CreateResultAPIView,
    CreateSampleAPIView,
    PendingOrderedTestsAPIView,
    PendingResultsAPIView,
    RejectResultAPIView,
    ResultDetailAPIView,
    SubmitResultAPIView,
    UpdateResultParameterAPIView,
)


urlpatterns = [
    path("samples/", CreateSampleAPIView.as_view(), name="create-sample"),
    path("ordered-tests/", CreateOrderedTestAPIView.as_view(), name="create-ordered-test"),
    path("ordered-tests/<str:order_id>/assign-sample/", AssignSampleAPIView.as_view(), name="assign-sample"),
    path("ordered-tests/pending/", PendingOrderedTestsAPIView.as_view(), name="pending-ordered-tests"),
    path("results/", CreateResultAPIView.as_view(), name="create-result"),
    path("results/pending/", PendingResultsAPIView.as_view(), name="pending-results"),
    path("results/<str:result_id>/", ResultDetailAPIView.as_view(), name="result-detail"),
    path("results/<str:result_id>/parameters/", UpdateResultParameterAPIView.as_view(), name="update-result-parameter"),
    path("results/<str:result_id>/submit/", SubmitResultAPIView.as_view(), name="submit-result"),
    path("results/<str:result_id>/approve/", ApproveResultAPIView.as_view(), name="approve-result"),
    path("results/<str:result_id>/reject/", RejectResultAPIView.as_view(), name="reject-result"),
]
