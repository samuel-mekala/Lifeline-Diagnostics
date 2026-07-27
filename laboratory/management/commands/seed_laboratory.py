from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from laboratory.models import (
    LaboratoryTest,
    TestPrice,
    Package,
    PackagePrice,
    PackageTest,
)

TESTS = [
    ("Complete Blood Picture (CBC)", "HEMATOLOGY", "BLOOD", Decimal("300")),
    ("ESR", "HEMATOLOGY", "BLOOD", Decimal("100")),
    ("HbA1c", "BIOCHEMISTRY", "BLOOD", Decimal("500")),
    ("Calcium, Serum", "BIOCHEMISTRY", "SERUM", Decimal("500")),
    ("Testosterone", "IMMUNOLOGY", "SERUM", Decimal("1500")),
    ("Vitamin B12", "BIOCHEMISTRY", "SERUM", Decimal("900")),
    ("Vitamin D Total", "BIOCHEMISTRY", "SERUM", Decimal("1000")),
    ("Iron Profile", "BIOCHEMISTRY", "SERUM", Decimal("800")),
    ("Kidney Function Mini Profile", "BIOCHEMISTRY", "SERUM", Decimal("800")),
    ("Lipid Profile", "BIOCHEMISTRY", "SERUM", Decimal("500")),
    ("Liver Function Profile", "BIOCHEMISTRY", "SERUM", Decimal("500")),
    ("Complete Urine Examination (CUE)", "PATHOLOGY", "URINE", Decimal("200")),
    ("Thyroid Profile I", "IMMUNOLOGY", "SERUM", Decimal("500")),
    ("FBS", "BIOCHEMISTRY", "BLOOD", Decimal("50")),
    ("PPBS", "BIOCHEMISTRY", "BLOOD", Decimal("50")),
    ("RBS", "BIOCHEMISTRY", "BLOOD", Decimal("50")),
    ("BP Checkup", "PATHOLOGY", "BLOOD", Decimal("50")),
]

PACKAGES = [
    {
        "name": "Ayush-2",
        "price": Decimal("750"),
        "tests": [
            "Complete Blood Picture (CBC)",
            "ESR",
            "HbA1c",
            "Calcium, Serum",
            "Iron Profile",
            "Kidney Function Mini Profile",
            "Lipid Profile",
            "Liver Function Profile",
            "Complete Urine Examination (CUE)",
            "Thyroid Profile I",
        ],
    },
    {
        "name": "Ayush-3",
        "price": Decimal("1500"),
        "tests": [
            "Complete Blood Picture (CBC)",
            "ESR",
            "HbA1c",
            "Calcium, Serum",
            "Iron Profile",
            "Kidney Function Mini Profile",
            "Lipid Profile",
            "Liver Function Profile",
            "Complete Urine Examination (CUE)",
            "Thyroid Profile I",
            "Testosterone",
            "Vitamin B12",
            "Vitamin D Total",
        ],
    },
]


class Command(BaseCommand):
    help = "Seed laboratory master data"

    @transaction.atomic
    def handle(self, *args, **kwargs):
        tests = {}

        for index, (name, category, sample_type, price) in enumerate(TESTS, start=1):
            test, _ = LaboratoryTest.objects.update_or_create(
                name=name,
                defaults={
                    "test_id": f"TES{index:04d}",
                    "category": category,
                    "sample_type": sample_type,
                    "is_active": True,
                },
            )

            TestPrice.objects.update_or_create(
                laboratory_test=test,
                defaults={
                    "walk_in_price": price,
                },
            )

            tests[name] = test

        for index, package_data in enumerate(PACKAGES, start=1):
            package, _ = Package.objects.update_or_create(
                name=package_data["name"],
                defaults={
                    "package_id": f"PKG{index:04d}",
                    "description": "",
                    "is_active": True,
                },
            )

            PackagePrice.objects.update_or_create(
                package=package,
                defaults={
                    "walk_in_price": package_data["price"],
                },
            )

            PackageTest.objects.filter(package=package).delete()

            for order, test_name in enumerate(package_data["tests"], start=1):
                PackageTest.objects.create(
                    package=package,
                    laboratory_test=tests[test_name],
                    display_order=order,
                )

        self.stdout.write(
            self.style.SUCCESS("Laboratory master data seeded successfully.")
        )