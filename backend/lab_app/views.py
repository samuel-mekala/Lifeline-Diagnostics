from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import TestCatalog, Patient, Visit, Sample, AuditLog, InventoryReagent

@api_view(['GET'])
def search_suggestions(query_param, request=None):
    """
    Returns search recommendations across test catalogs, patient records, and visit IDs.
    """
    q = request.GET.get('q', '').strip() if request else ''
    
    DEFAULT_RECOMMENDATIONS = [
        {'label': 'Complete Blood Count (CBC)', 'category': 'Hematology', 'tag': 'Popular'},
        {'label': 'Lipid Profile', 'category': 'Biochemistry', 'tag': 'Fast'},
        {'label': 'Fasting Blood Sugar (FBS)', 'category': 'Biochemistry', 'tag': 'Diabetes'},
        {'label': 'Thyroid Profile (T3, T4, TSH)', 'category': 'Immunology', 'tag': 'Hormones'},
        {'label': 'HbA1c Glycated Hemoglobin', 'category': 'Biochemistry', 'tag': 'Diabetes'},
        {'label': 'Kidney Function Test (KFT)', 'category': 'Biochemistry', 'tag': 'Renal'},
        {'label': 'Liver Function Test (LFT)', 'category': 'Biochemistry', 'tag': 'Hepatic'},
        {'label': 'Vitamin D3 & B12', 'category': 'Immunology', 'tag': 'Vitamins'},
    ]

    if not q:
        return Response({'query': q, 'results': DEFAULT_RECOMMENDATIONS})

    # Filter recommendations matching user query
    matches = [r for r in DEFAULT_RECOMMENDATIONS if q.lower() in r['label'].lower() or q.lower() in r['category'].lower()]
    return Response({'query': q, 'results': matches})

@api_view(['GET'])
def test_catalog_list(request):
    tests = TestCatalog.objects.all().values()
    return Response(list(tests))

@api_view(['GET'])
def patient_list(request):
    patients = Patient.objects.all().values()
    return Response(list(patients))
