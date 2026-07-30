"""
Management command to seed the full test catalog and system accounts into MySQL with 6-digit zero-padded IDs.
Run: python manage.py seed_full_catalog
"""
from django.core.management.base import BaseCommand
from django.db import transaction
import datetime


TESTS = [
    {"test_id": "TES-000001", "name": "Complete Blood Picture (CBC)", "category": "HEMATOLOGY", "sample_type": "BLOOD", "walk_in_price": 300},
    {"test_id": "TES-000002", "name": "Erythrocyte Sedimentation Rate (ESR)", "category": "HEMATOLOGY", "sample_type": "BLOOD", "walk_in_price": 100},
    {"test_id": "TES-000003", "name": "Glycated Hemoglobin (HbA1c)", "category": "BIOCHEMISTRY", "sample_type": "BLOOD", "walk_in_price": 500},
    {"test_id": "TES-000004", "name": "Serum Calcium Test", "category": "BIOCHEMISTRY", "sample_type": "SERUM", "walk_in_price": 500},
    {"test_id": "TES-000005", "name": "Total Testosterone Test (Serum Testosterone)", "category": "IMMUNOLOGY", "sample_type": "SERUM", "walk_in_price": 1500},
    {"test_id": "TES-000006", "name": "Vitamin B12 Assay (Cobalamin)", "category": "BIOCHEMISTRY", "sample_type": "SERUM", "walk_in_price": 900},
    {"test_id": "TES-000007", "name": "Vitamin D3 Total (25-OH Hydroxy Vitamin D)", "category": "BIOCHEMISTRY", "sample_type": "SERUM", "walk_in_price": 1000},
    {"test_id": "TES-000008", "name": "Iron Profile (Fe, TIBC, % Sat)", "category": "BIOCHEMISTRY", "sample_type": "SERUM", "walk_in_price": 800},
    {"test_id": "TES-000009", "name": "Kidney Function Mini Profile (KFT)", "category": "BIOCHEMISTRY", "sample_type": "SERUM", "walk_in_price": 800},
    {"test_id": "TES-000010", "name": "Lipid Profile Complete", "category": "BIOCHEMISTRY", "sample_type": "SERUM", "walk_in_price": 500},
    {"test_id": "TES-000011", "name": "Liver Function Test (LFT)", "category": "BIOCHEMISTRY", "sample_type": "SERUM", "walk_in_price": 500},
    {"test_id": "TES-000012", "name": "Complete Urine Examination (CUE)", "category": "PATHOLOGY", "sample_type": "URINE", "walk_in_price": 200},
    {"test_id": "TES-000013", "name": "Thyroid Profile I (T3, T4, TSH)", "category": "IMMUNOLOGY", "sample_type": "SERUM", "walk_in_price": 500},
    {"test_id": "TES-000014", "name": "Fasting Blood Sugar (FBS)", "category": "BIOCHEMISTRY", "sample_type": "BLOOD", "walk_in_price": 50},
    {"test_id": "TES-000015", "name": "Post Prandial Blood Sugar (PPBS)", "category": "BIOCHEMISTRY", "sample_type": "BLOOD", "walk_in_price": 50},
]

PACKAGES = [
    {
        "package_id": "PKG-000001",
        "name": "Ayush-2 Full Body Checkup",
        "description": "Essential preventive health profile covering Blood, Sugar, Thyroid, Kidney, Liver & Urine screening.",
        "walk_in_price": 750,
        "test_ids": ["TES-000001", "TES-000002", "TES-000003", "TES-000004", "TES-000008", "TES-000009", "TES-000010", "TES-000011", "TES-000012", "TES-000013"],
    },
    {
        "package_id": "PKG-000002",
        "name": "Ayush-3 Comprehensive Master Health",
        "description": "Advanced diagnostic screening adding Vitamins B12/D3 and Hormonal evaluation.",
        "walk_in_price": 1500,
        "test_ids": ["TES-000001", "TES-000002", "TES-000003", "TES-000004", "TES-000005", "TES-000006", "TES-000007", "TES-000008", "TES-000009", "TES-000010", "TES-000011", "TES-000012", "TES-000013"],
    },
    {
        "package_id": "PKG-000003",
        "name": "Cardiac & Metabolic Care Package",
        "description": "Targeted assessment for heart health, cholesterol, lipid balances, and blood sugar control.",
        "walk_in_price": 999,
        "test_ids": ["TES-000001", "TES-000003", "TES-000009", "TES-000010", "TES-000014", "TES-000015"],
    },
]

SYSTEM_ACCOUNTS = [
    {"email": "samuel@gmail.com", "full_name": "Samuel Mekala", "role": "OWNER", "password": "admin123"},
    {"email": "admin@lifeline.com", "full_name": "System Admin", "role": "ADMIN", "password": "admin123"},
    {"email": "reception@lifeline.com", "full_name": "Priya Sharma", "role": "RECEPTIONIST", "password": "admin123"},
    {"email": "tech@lifeline.com", "full_name": "Sunny", "role": "LAB_TECHNICIAN", "password": "admin123"},
    {"email": "patho@lifeline.com", "full_name": "Dr. Sunita Rao", "role": "PATHOLOGIST", "password": "admin123"},
    {"email": "patient@gmail.com", "full_name": "Demo Patient", "role": "PATIENT", "password": "admin123"},
]


class Command(BaseCommand):
    help = "Seed full laboratory test catalog, pricing, packages, and system accounts into MySQL."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("=== Seeding Life Line Diagnostics Database (6-Digit IDs) ==="))

        from laboratory.models import LaboratoryTest, TestPrice, Package, PackagePrice, PackageTest
        from accounts.models import User
        from patients.models import Patient
        from common.services.id_generator import generate_business_id

        with transaction.atomic():
            # Clear old non-standard catalog entries
            PackageTest.objects.all().delete()
            PackagePrice.objects.all().delete()
            Package.objects.all().delete()
            TestPrice.objects.all().delete()
            LaboratoryTest.objects.all().delete()

            # 1. Seed Tests
            self.stdout.write("\n📋 Seeding laboratory tests...")
            test_map = {}
            for tdata in TESTS:
                test_obj = LaboratoryTest.objects.create(
                    test_id=tdata["test_id"],
                    name=tdata["name"],
                    category=tdata["category"],
                    sample_type=tdata["sample_type"],
                    is_active=True,
                )
                test_map[tdata["test_id"]] = test_obj

                # Seed pricing
                TestPrice.objects.create(
                    laboratory_test=test_obj,
                    walk_in_price=tdata["walk_in_price"],
                )

                self.stdout.write(f"  ✓ {test_obj.test_id}: {test_obj.name} — ₹{tdata['walk_in_price']}")

            # 2. Seed Packages
            self.stdout.write("\n📦 Seeding packages...")
            for pdata in PACKAGES:
                pkg_obj = Package.objects.create(
                    package_id=pdata["package_id"],
                    name=pdata["name"],
                    description=pdata["description"],
                    is_active=True,
                )

                # Seed package pricing
                PackagePrice.objects.create(
                    package=pkg_obj,
                    walk_in_price=pdata["walk_in_price"],
                )

                # Link package tests
                for tid in pdata["test_ids"]:
                    if tid in test_map:
                        PackageTest.objects.create(
                            package=pkg_obj,
                            laboratory_test=test_map[tid],
                        )

                self.stdout.write(f"  ✓ {pkg_obj.package_id}: {pkg_obj.name} — ₹{pdata['walk_in_price']} ({len(pdata['test_ids'])} tests)")

            # 3. Seed System Accounts
            self.stdout.write("\n👥 Seeding system accounts...")
            for acc in SYSTEM_ACCOUNTS:
                user, created = User.objects.get_or_create(
                    email=acc["email"],
                    defaults={
                        "full_name": acc["full_name"],
                        "role": acc["role"],
                        "is_active": True,
                        "is_staff": acc["role"] in ("OWNER", "ADMIN"),
                        "is_superuser": acc["role"] == "OWNER",
                    },
                )
                if created:
                    user.set_password(acc["password"])
                    user.save()

                # Create Patient record for demo patient
                if acc["role"] == "PATIENT" and created:
                    patient_id = generate_business_id(Patient, "patient_id", "PAT")
                    Patient.objects.get_or_create(
                        linked_user=user,
                        defaults={
                            "patient_id": patient_id,
                            "full_name": acc["full_name"],
                            "date_of_birth": datetime.date(1990, 6, 15),
                            "gender": "M",
                            "phone": "+91 98765 43210",
                            "email": acc["email"],
                            "address": "Vijayawada, Andhra Pradesh",
                        },
                    )

                status_str = "✓ Created" if created else "↻ Already exists"
                self.stdout.write(f"  {status_str}: {acc['email']} ({acc['role']})")

        self.stdout.write(self.style.SUCCESS("\n✅ Database seeding complete!"))
        self.stdout.write("   → 15 tests seeded with 6-digit IDs (TES-000001 to TES-000015)")
        self.stdout.write("   → 3 packages seeded with 6-digit IDs (PKG-000001 to PKG-000003)")
        self.stdout.write("   → System accounts ready")

        self.stdout.write("\n   Backend: http://127.0.0.1:8000")
        self.stdout.write("   Admin panel: http://127.0.0.1:8000/admin/")
