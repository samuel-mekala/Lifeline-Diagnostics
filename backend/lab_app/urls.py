from django.urls import path
from . import views

urlpatterns = [
    path('search-suggestions/', views.search_suggestions, name='search_suggestions'),
    path('tests/', views.test_catalog_list, name='test_catalog_list'),
    path('patients/', views.patient_list, name='patient_list'),
]
