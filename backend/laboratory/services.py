from common.services.id_generator import generate_business_id
from django.utils import timezone
import re
from django.db.models import Q
from visits.models import Visit

from .models import (
    LaboratoryTest,
    OrderedTest,
    Sample,
    TestParameter,
    Result,
    ResultParameter,
)
from django.db import transaction


class LaboratoryTestService:
    @staticmethod
    def create_test(**kwargs):
        kwargs["test_id"] = generate_business_id(
            model=LaboratoryTest,
            field="test_id",
            prefix="TES",
        )
        return LaboratoryTest.objects.create(**kwargs)


class OrderedTestService:

    @staticmethod
    def list_pending_ordered_tests(*, filters):
        ordered_tests = OrderedTest.objects.filter(
            status__in=["PENDING", "SAMPLE_COLLECTED", "IN_PROGRESS"],
        ).select_related("visit__patient", "laboratory_test")
        if search := filters.get("search"):
            ordered_tests = ordered_tests.filter(
                Q(order_id__icontains=search)
                | Q(visit__patient__full_name__icontains=search)
                | Q(laboratory_test__name__icontains=search)
            )
        if patient_id := filters.get("patient_id"):
            ordered_tests = ordered_tests.filter(visit__patient__patient_id=patient_id)
        if test_id := filters.get("test_id"):
            ordered_tests = ordered_tests.filter(laboratory_test__test_id=test_id)
        if status := filters.get("status"):
            ordered_tests = ordered_tests.filter(status=status)
        if created_from := filters.get("created_from"):
            ordered_tests = ordered_tests.filter(created_at__date__gte=created_from)
        if created_to := filters.get("created_to"):
            ordered_tests = ordered_tests.filter(created_at__date__lte=created_to)
        return ordered_tests.order_by(filters["ordering"])

    @staticmethod
    @transaction.atomic
    def create_ordered_test(
        *,
        visit_id,
        test_id,
        sample=None,
        remarks="",
    ):
        try:
            visit = Visit.objects.get(visit_id=visit_id)
        except Visit.DoesNotExist as exc:
            raise ValueError("Visit not found.") from exc

        try:
            laboratory_test = LaboratoryTest.objects.get(test_id=test_id)
        except LaboratoryTest.DoesNotExist as exc:
            raise ValueError("Laboratory test not found.") from exc

        if not laboratory_test.is_active:
            raise ValueError("Inactive laboratory tests cannot be ordered.")

        return OrderedTest.objects.create(
            order_id=generate_business_id(
                model=OrderedTest,
                field="order_id",
                prefix="ORD",
            ),
            visit=visit,
            laboratory_test=laboratory_test,
            sample=sample,
            remarks=remarks,
        )

    @staticmethod
    @transaction.atomic
    def update_ordered_test(
        *,
        ordered_test,
        **kwargs,
    ):
        for field, value in kwargs.items():
            setattr(ordered_test, field, value)

        ordered_test.save()

        return ordered_test

    @staticmethod
    @transaction.atomic
    def assign_sample(
        *,
        order_id,
        sample_id,
    ):
        try:
            ordered_test = OrderedTest.objects.select_for_update().get(order_id=order_id)
        except OrderedTest.DoesNotExist as exc:
            raise ValueError("Ordered test not found.") from exc

        try:
            sample = Sample.objects.get(sample_id=sample_id)
        except Sample.DoesNotExist as exc:
            raise ValueError("Sample not found.") from exc

        if ordered_test.status != "PENDING":
            raise ValueError(
                "Samples can only be assigned to pending ordered tests."
            )

        SampleService.prepare_for_assignment(
            sample=sample,
            ordered_test=ordered_test,
        )

        ordered_test.sample = sample
        ordered_test.status = "SAMPLE_COLLECTED"
        ordered_test.save(
            update_fields=[
                "sample",
                "status",
            ]
        )

        return ordered_test


class SampleService:

    PENDING = "PENDING"
    COLLECTED = "COLLECTED"
    REJECTED = "REJECTED"


    @staticmethod
    @transaction.atomic
    def create_sample(
        *,
        visit_id,
        sample_type,
        collected_by=None,
        remarks="",
    ):
        try:
            visit = Visit.objects.get(visit_id=visit_id)
        except Visit.DoesNotExist as exc:
            raise ValueError("Visit not found.") from exc

        return Sample.objects.create(
            sample_id=generate_business_id(
                model=Sample,
                field="sample_id",
                prefix="SAM",
            ),
            visit=visit,
            sample_type=sample_type,
            collected_by=collected_by,
            remarks=remarks,
        )

    @staticmethod
    @transaction.atomic
    def collect_sample(*, sample):
        if sample.status != SampleService.PENDING:
            raise ValueError("Only pending samples can be collected.")

        sample.status = SampleService.COLLECTED
        sample.collected_at = timezone.now()
        sample.save(update_fields=["status", "collected_at"])
        return sample

    @staticmethod
    @transaction.atomic
    def reject_sample(*, sample):
        if sample.status not in {
            SampleService.PENDING,
            SampleService.COLLECTED,
        }:
            raise ValueError("Rejected samples cannot change status.")

        sample.status = SampleService.REJECTED
        sample.save(update_fields=["status"])
        return sample

    @staticmethod
    def validate_compatibility(*, sample, ordered_test):
        if sample.visit_id != ordered_test.visit_id:
            raise ValueError(
                "Sample and ordered test must belong to the same visit."
            )

        if sample.sample_type != ordered_test.laboratory_test.sample_type:
            raise ValueError(
                "Sample type does not match the ordered test requirement."
            )

    @staticmethod
    @transaction.atomic
    def prepare_for_assignment(*, sample, ordered_test):
        SampleService.validate_compatibility(
            sample=sample,
            ordered_test=ordered_test,
        )

        if sample.status == SampleService.PENDING:
            SampleService.collect_sample(sample=sample)
        elif sample.status != SampleService.COLLECTED:
            raise ValueError("Only collected samples can be assigned to ordered tests.")

        return sample

    @staticmethod
    @transaction.atomic
    def update_sample(
        *,
        sample,
        **kwargs,
    ):
        if "status" in kwargs or "collected_at" in kwargs:
            raise ValueError(
                "Use the sample lifecycle service methods to change sample status."
            )

        for field, value in kwargs.items():
            setattr(sample, field, value)

        sample.save()

        return sample


class TestParameterService:

    @staticmethod
    @transaction.atomic
    def create_parameter(
        *,
        laboratory_test,
        name,
        unit="",
        reference_range="",
        display_order,
    ):
        return TestParameter.objects.create(
            parameter_id=generate_business_id(
                model=TestParameter,
                field="parameter_id",
                prefix="PAR",
            ),
            reference_range=reference_range,
            laboratory_test=laboratory_test,
            name=name,
            unit=unit,
            display_order=display_order,
        )

    @staticmethod
    @transaction.atomic
    def update_parameter(parameter, **kwargs):
        for field, value in kwargs.items():
            setattr(parameter, field, value)

        parameter.save()

        return parameter

    @staticmethod
    @transaction.atomic
    def activate(parameter):
        parameter.is_active = True
        parameter.save(update_fields=["is_active"])

    @staticmethod
    @transaction.atomic
    def deactivate(parameter):
        parameter.is_active = False
        parameter.save(update_fields=["is_active"])


class ResultService:

    @staticmethod
    def list_submitted_results(*, filters):
        results = Result.objects.filter(
            status=Result.Status.SUBMITTED,
        ).select_related("ordered_test__visit__patient", "ordered_test__laboratory_test")
        if search := filters.get("search"):
            results = results.filter(
                Q(result_id__icontains=search)
                | Q(ordered_test__visit__patient__full_name__icontains=search)
                | Q(ordered_test__laboratory_test__name__icontains=search)
            )
        if patient_id := filters.get("patient_id"):
            results = results.filter(ordered_test__visit__patient__patient_id=patient_id)
        if status := filters.get("status"):
            results = results.filter(status=status)
        if created_from := filters.get("created_from"):
            results = results.filter(created_at__date__gte=created_from)
        if created_to := filters.get("created_to"):
            results = results.filter(created_at__date__lte=created_to)
        return results.order_by(filters["ordering"])

    @staticmethod
    @transaction.atomic
    def create_result(
        *,
        order_id,
    ):
        ordered_test = OrderedTest.objects.select_related(
            "sample",
            "laboratory_test",
        ).get(
            order_id=order_id
        )

        if Result.objects.filter(ordered_test=ordered_test).exists():
            raise ValueError("A result already exists for this ordered test.")

        if ordered_test.sample is None:
            raise ValueError(
                "Sample has not been assigned."
            )

        if ordered_test.status != "SAMPLE_COLLECTED":
            raise ValueError(
                "A result can only be created after sample collection."
            )

        SampleService.validate_compatibility(
            sample=ordered_test.sample,
            ordered_test=ordered_test,
        )

        if ordered_test.sample.status != SampleService.COLLECTED:
            raise ValueError(
                "A result can only be created from a collected sample."
            )

        result = Result.objects.create(
            result_id=generate_business_id(
                model=Result,
                field="result_id",
                prefix="RES",
            ),
            sample=ordered_test.sample,
            ordered_test=ordered_test,
        )

        parameters = ordered_test.laboratory_test.parameters.filter(is_active=True)

        ResultParameter.objects.bulk_create(
            [
                ResultParameter(
                    result=result,
                    test_parameter=parameter,
                    reference_range=parameter.reference_range,
                    value="",
                    flag=ResultParameter.Flag.NOT_APPLICABLE,
                )
                for parameter in parameters
            ]
        )

        return result

    @staticmethod
    def get_result(*, result_id):
        return Result.objects.select_related(
            "sample",
            "ordered_test__visit__patient",
            "ordered_test__laboratory_test",
        ).prefetch_related("parameters__test_parameter").get(result_id=result_id)

class ResultEntryService:

    @staticmethod
    @transaction.atomic
    def update_parameter(
        *,
        result_parameter,
        value,
        remarks="",
    ):
        if result_parameter.result.status != Result.Status.DRAFT:
            raise ValueError("Only draft results can be edited.")

        value = value.strip()
        if not value:
            raise ValueError("Result parameter value cannot be blank.")

        result_parameter.value = value
        result_parameter.remarks = remarks
        result_parameter.save(
            update_fields=[
                "value",
                "remarks",
                "updated_at",
            ]
        )

        ResultValidationService.evaluate_parameter(result_parameter)

        return result_parameter

class ResultApprovalService:

    @staticmethod
    @transaction.atomic
    def submit_result(*, result, remarks=""):
        if result.status != Result.Status.DRAFT:
            raise ValueError("Only draft results can be submitted.")

        if result.parameters.filter(value="").exists():
            raise ValueError(
                "All result parameters must have values before submission."
            )

        result.status = Result.Status.SUBMITTED
        result.remarks = remarks
        result.save(update_fields=["status", "remarks", "updated_at"])

        return result

    @staticmethod
    @transaction.atomic
    def approve_result(*, result, verified_by, remarks=""):
        if result.status != Result.Status.SUBMITTED:
            raise ValueError(
                "Only submitted results can be approved."
            )
        if verified_by is None or not verified_by.pk:
            raise ValueError("An approving pathologist is required.")

        result.status = Result.Status.APPROVED
        result.verified_by = verified_by
        result.verified_at = timezone.now()
        result.remarks = remarks

        result.save(
            update_fields=[
                "status",
                "verified_by",
                "verified_at",
                "remarks",
                "updated_at",
            ]
        )

        return result

    @staticmethod
    @transaction.atomic
    def reject_result(*, result, remarks=""):
        if result.status != Result.Status.SUBMITTED:
            raise ValueError("Only submitted results can be rejected.")
        if not remarks.strip():
            raise ValueError("A rejection remark is required.")

        result.status = Result.Status.REJECTED
        result.remarks = remarks

        result.save(update_fields=["status", "remarks", "updated_at"])

        return result


class ResultValidationService:

    @staticmethod
    def evaluate_parameter(result_parameter):
        reference = (result_parameter.reference_range or "").strip()
        value = (result_parameter.value or "").strip()

        try:
            value = float(value)
        except ValueError:
            result_parameter.flag = ResultParameter.Flag.NOT_APPLICABLE
            result_parameter.save(update_fields=["flag"])
            return

        reference = reference.replace("–", "-")

        match = re.search(r"(\d+(\.\d+)?)\s*-\s*(\d+(\.\d+)?)", reference)

        if match:
            low = float(match.group(1))
            high = float(match.group(3))

            if value < low:
                flag = ResultParameter.Flag.LOW
            elif value > high:
                flag = ResultParameter.Flag.HIGH
            else:
                flag = ResultParameter.Flag.NORMAL

            result_parameter.flag = flag
            result_parameter.save(update_fields=["flag"])
            return

        match = re.search(r"<\s*(\d+(\.\d+)?)", reference)

        if match:
            high = float(match.group(1))

            result_parameter.flag = (
                ResultParameter.Flag.NORMAL
                if value < high
                else ResultParameter.Flag.HIGH
            )

            result_parameter.save(update_fields=["flag"])
            return

        match = re.search(r">\s*(\d+(\.\d+)?)", reference)

        if match:
            low = float(match.group(1))

            result_parameter.flag = (
                ResultParameter.Flag.NORMAL
                if value > low
                else ResultParameter.Flag.LOW
            )

            result_parameter.save(update_fields=["flag"])
            return

        result_parameter.flag = ResultParameter.Flag.NOT_APPLICABLE
        result_parameter.save(update_fields=["flag"])


class ReportService:

    @staticmethod
    def generate_report_data(result):
        return {
            "patient": result.sample.visit.patient,
            "visit": result.sample.visit,
            "sample": result.sample,
            "ordered_test": result.ordered_test,
            "laboratory_test": result.ordered_test.laboratory_test,
            "parameters": result.parameters.select_related(
                "test_parameter"
            ).order_by(
                "test_parameter__display_order"
            ),
            "verified_by": result.verified_by,
            "verified_at": result.verified_at,
            "remarks": result.remarks,
        }
