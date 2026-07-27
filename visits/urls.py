from django.urls import path

from visits.views import (
    CreateVisitAPIView,
    VisitDetailAPIView,
    VisitListAPIView,
    VisitSearchAPIView,
    UpdateVisitAPIView,
    UpdateVisitStatusAPIView,
)

urlpatterns = [
    path("create/", CreateVisitAPIView.as_view(), name="create-visit"),
    path("list/", VisitListAPIView.as_view(), name="visit-list"),
    path("search/", VisitSearchAPIView.as_view(), name="visit-search"),
    path("update/<str:visit_id>/", UpdateVisitAPIView.as_view(), name="update-visit"),
    path("status/<str:visit_id>/", UpdateVisitStatusAPIView.as_view(), name="update-visit-status"),
    path("<str:visit_id>/", VisitDetailAPIView.as_view(), name="visit-detail"),
]
