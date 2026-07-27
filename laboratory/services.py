from common.services.id_generator import generate_business_id
from django.utils import timezone
import re
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
    @transaction.atomic
    def create_ordered_test(
        *,
        visit_id,
        test_id,
        sample=None,
        remarks="",
    ):
        visit = Visit.objects.get(
            visit_id=visit_id
        )

        laboratory_test = LaboratoryTest.objects.get(
            test_id=test_id
        )

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
            ordered_test = OrderedTest.objects.get(order_id=order_id)
        except OrderedTest.DoesNotExist as exc:
            raise ValueError("Ordered test not found.") from exc

        try:
            sample = Sample.objects.get(sample_id=sample_id)
        except Sample.DoesNotExist as exc:
            raise ValueError("Sample not found.") from exc

        if sample.visit_id != ordered_test.visit_id:
            raise ValueError(
                "Sample and ordered test must belong to the same visit."
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

    @staticmethod
    @transaction.atomic
    def create_sample(
        *,
        visit_id,
        sample_type,
        collected_by=None,
        remarks="",
    ):
        visit = Visit.objects.get(
            visit_id=visit_id
        )

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
    def update_sample(
        *,
        sample,
        **kwargs,
    ):
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

        if ordered_test.sample is None:
            raise ValueError(
                "Sample has not been assigned."
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

        parameters = ordered_test.laboratory_test.parameters.all()

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
    @transaction.atomic
    def assign_sample(
        *,
        ordered_test,
        sample,
    ):
        ordered_test.sample = sample
        ordered_test.status = "SAMPLE_COLLECTED"
        ordered_test.save(update_fields=["sample", "status"])

        return ordered_test

class ResultEntryService:

    @staticmethod
    @transaction.atomic
    def update_parameter(
        *,
        result_parameter,
        value,
        remarks="",
    ):
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
    def submit_for_approval(result):
        if result.parameters.filter(value="").exists():
            raise ValueError(
                "All result parameters must have values before submission."
            )

        result.status = Result.Status.PENDING_APPROVAL
        result.save(update_fields=["status"])

        return result

    @staticmethod
    @transaction.atomic
    def approve_result(*, result, verified_by):
        if result.status != Result.Status.PENDING_APPROVAL:
            raise ValueError(
                "Only pending results can be approved."
            )

        result.status = Result.Status.APPROVED
        result.verified_by = verified_by
        result.verified_at = timezone.now()

        result.save(
            update_fields=[
                "status",
                "verified_by",
                "verified_at",
            ]
        )

        return result

    @staticmethod
    @transaction.atomic
    def reject_result(*, result):
        result.status = Result.Status.REJECTED

        result.save(update_fields=["status"])

        return result

import re


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
