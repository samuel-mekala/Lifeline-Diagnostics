from django.db import transaction
from django.utils import timezone
from .services.result_service import ResultService
from .models import OrderedTest, Sample
from .services import SampleService, ResultService

class LabWorkflowService:
    @staticmethod
    @transaction.atomic
    def collect_sample(
        *,
        visit,
        sample_type,
        collected_by,
        remarks="",
    ):
        sample = SampleService.create_sample(
            visit=visit,
            sample_type=sample_type,
            status="COLLECTED",
            collected_by=collected_by,
            collected_at=timezone.now(),
            remarks=remarks,
        )

        ordered_tests = OrderedTest.objects.filter(
            visit=visit,
            sample__isnull=True,
            laboratory_test__sample_type=sample_type,
        )

        for ordered_test in ordered_tests:
            ordered_test.sample = sample
            ordered_test.status = "SAMPLE_COLLECTED"
            ordered_test.save()

            ResultService.create_result(
                sample=sample,
                ordered_test=ordered_test,
            )

        return sample