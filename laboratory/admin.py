from django.contrib import admin
from common.admin import BusinessIDAdmin
from laboratory.models import TestParameter
from .models import Package, PackageTest, TestPrice, PackagePrice
from laboratory.models import Result
from laboratory.models import ResultParameter

from .models import LaboratoryTest, OrderedTest, Sample

# Register your models here.

@admin.register(LaboratoryTest)
class LaboratoryTestAdmin(BusinessIDAdmin):
    business_id_field = "test_id"
    business_id_prefix = "TES"
    exclude = ("test_id",)

    list_display = (
        "test_id",
        "name",
        "category",
        "sample_type",
        "is_active",
    )

    search_fields = (
        "test_id",
        "name",
    )

    list_filter = (
        "category",
        "sample_type",
        "is_active",
    )

    ordering = ("name",)


@admin.register(OrderedTest)
class OrderedTestAdmin(BusinessIDAdmin):
    business_id_field = "order_id"
    business_id_prefix = "ORD"
    exclude = ("order_id",)

    list_display = (
        "order_id",
        "visit",
        "laboratory_test",
        "status",
        "created_at",
    )

    search_fields = (
        "order_id",
        "visit__visit_id",
        "laboratory_test__name",
    )

    list_filter = (
        "status",
        "created_at",
    )

    ordering = ("-created_at",)



@admin.register(Sample)
class SampleAdmin(BusinessIDAdmin):
    business_id_field = "sample_id"
    business_id_prefix = "SAM"
    exclude = ("sample_id",)

    list_display = (
        "sample_id",
        "visit",
        "sample_type",
        "status",
        "collected_by",
        "collected_at",
    )

    search_fields = (
        "sample_id",
        "visit__visit_id",
    )

    list_filter = (
        "sample_type",
        "status",
    )

    ordering = ("-created_at",)

@admin.register(TestParameter)
class TestParameterAdmin(BusinessIDAdmin):
    business_id_field = "parameter_id"
    business_id_prefix = "PAR"

    list_display = (
        "parameter_id",
        "laboratory_test",
        "name",
        "unit",
        "display_order",
        "is_active",
    )

    list_filter = (
        "laboratory_test",
        "is_active",
    )

    search_fields = (
        "parameter_id",
        "name",
        "laboratory_test__name",
    )

    ordering = (
        "laboratory_test",
        "display_order",
    )

@admin.register(Result)
class ResultAdmin(BusinessIDAdmin):
    business_id_field = "result_id"
    business_id_prefix = "RES"

    list_display = (
        "result_id",
        "ordered_test",
        "sample",
        "status",
        "verified_by",
        "verified_at",
    )

    list_filter = (
        "status",
    )

    search_fields = (
        "result_id",
        "ordered_test__laboratory_test__name",
        "sample__sample_id",
    )


@admin.register(ResultParameter)
class ResultParameterAdmin(admin.ModelAdmin):
    list_display = (
        "result",
        "test_parameter",
        "value",
    )

    search_fields = (
        "result__result_id",
        "test_parameter__name",
    )

@admin.register(Package)
class PackageAdmin(BusinessIDAdmin):
    business_id_field = "package_id"
    business_id_prefix = "PKG"
    exclude = ("package_id",)

    list_display = (
        "package_id",
        "name",
        "is_active",
        "created_at",
    )

    search_fields = (
        "package_id",
        "name",
    )

    list_filter = (
        "is_active",
    )


@admin.register(PackageTest)
class PackageTestAdmin(admin.ModelAdmin):
    list_display = (
        "package",
        "laboratory_test",
        "display_order",
    )

    list_filter = (
        "package",
    )

    ordering = (
        "package",
        "display_order",
    )


@admin.register(TestPrice)
class TestPriceAdmin(admin.ModelAdmin):
    list_display = (
        "laboratory_test",
        "walk_in_price",
        "home_collection_price",
        "doctor_referral_price",
    )

    search_fields = (
        "laboratory_test__name",
    )


@admin.register(PackagePrice)
class PackagePriceAdmin(admin.ModelAdmin):
    list_display = (
        "package",
        "walk_in_price",
        "home_collection_price",
        "doctor_referral_price",
    )

    search_fields = (
        "package__name",
    )