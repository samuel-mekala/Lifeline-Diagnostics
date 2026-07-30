"""
Management command to seed the full test catalog and system accounts into MySQL.
Run: python manage.py seed_full_catalog
"""
from django.core.management.base import BaseCommand
from django.db import transaction
import datetime


TESTS = [
    {"test_id": "TES-001", "name": "Complete Blood Picture (CBC)", "category": "HEMATOLOGY", "sample_type": "BLOOD", "walk_in_price": 300},
    {"test_id": "TES-002", "name": "Erythrocyte Sedimentation Rate (ESR)", "category": "HEMATOLOGY", "sample_type": "BLOOD", "walk_in_price": 100},
    {"test_id": "TES-003", "name": "Glycated Hemoglobin (HbA1c)", "category": "BIOCHEMISTRY", "sample_type": "BLOOD", "walk_in_price": 500},
    {"test_id": "TES-004", "name": "Serum Calcium Test", "category": "BIOCHEMISTRY", "sample_type": "SERUM", "walk_in_price": 500},
    {"test_id": "TES-005", "name": "Total Testosterone Test (Serum Testosterone)", "category": "IMMUNOLOGY", "sample_type": "SERUM", "walk_in_price": 1500},
    {"test_id": "TES-006", "name": "Vitamin B12 Assay (Cobalamin)", "category": "BIOCHEMISTRY", "sample_type": "SERUM", "walk_in_price": 900},
    {"test_id": "TES-007", "name": "Vitamin D3 Total (25-OH Hydroxy Vitamin D)", "category": "BIOCHEMISTRY", "sample_type": "SERUM", "walk_in_price": 1000},
    {"test_id": "TES-008", "name": "Iron Profile (Fe, TIBC, % Sat)", "category": "BIOCHEMISTRY", "sample_type": "SERUM", "walk_in_price": 800},
    {"test_id": "TES-009", "name": "Kidney Function Mini Profile (KFT)", "category": "BIOCHEMISTRY", "sample_type": "SERUM", "walk_in_price": 800},
    {"test_id": "TES-010", "name": "Lipid Profile Complete", "category": "BIOCHEMISTRY", "sample_type": "SERUM", "walk_in_price": 500},
    {"test_id": "TES-011", "name": "Liver Function Test (LFT)", "category": "BIOCHEMISTRY", "sample_type": "SERUM", "walk_in_price": 500},
    {"test_id": "TES-012", "name": "Complete Urine Examination (CUE)", "category": "PATHOLOGY", "sample_type": "URINE", "walk_in_price": 200},
    {"test_id": "TES-013", "name": "Thyroid Profile I (T3, T4, TSH)", "category": "IMMUNOLOGY", "sample_type": "SERUM", "walk_in_price": 500},
    {"test_id": "TES-014", "name": "Fasting Blood Sugar (FBS)", "category": "BIOCHEMISTRY", "sample_type": "BLOOD", "walk_in_price": 50},
    {"test_id": "TES-015", "name": "Post Prandial Blood Sugar (PPBS)", "category": "BIOCHEMISTRY", "sample_type": "BLOOD", "walk_in_price": 50},
]

PACKAGES = [
    {
        "package_id": "PKG-001",
        "name": "Ayush-2 Full Body Checkup",
        "description": "Essential preventive health profile covering Blood, Sugar, Thyroid, Kidney, Liver & Urine screening.",
        "walk_in_price": 750,
        "test_ids": ["TES-001", "TES-002", "TES-003", "TES-004", "TES-008", "TES-009", "TES-010", "TES-011", "TES-012", "TES-013"],
    },
    {
        "package_id": "PKG-002",
        "name": "Ayush-3 Comprehensive Master Health",
        "description": "Advanced diagnostic screening adding Vitamins B12/D3 and Hormonal evaluation.",
        "walk_in_price": 1500,
        "test_ids": ["TES-001", "TES-002", "TES-003", "TES-004", "TES-005", "TES-006", "TES-007", "TES-008", "TES-009", "TES-010", "TES-011", "TES-012", "TES-013"],
    },
    {
        "package_id": "PKG-003",
        "name": "Cardiac & Metabolic Care Package",
        "description": "Targeted assessment for heart health, cholesterol, lipid balances, and blood sugar control.",
        "walk_in_price": 999,
        "test_ids": ["TES-001", "TES-003", "TES-009", "TES-010", "TES-014", "TES-015"],
    },
]

SYSTEM_ACCOUNTS = [
    {"email": "samuel@gmail.com", "full_name": "Samuel Mekala", "role": "OWNER", "password": "admin123"},
    {"email": "admin@lifeline.com", "full_name": "System Admin", "role": "ADMIN", "password": "admin123"},
    {"email": "reception@lifeline.com", "full_name": "Priya Sharma", "role": "RECEPTIONIST", "password": "admin123"},
    {"email": "tech@lifeline.com", "full_name": "Anil Verma", "role": "LAB_TECHNICIAN", "password": "admin123"},
    {"email": "patho@lifeline.com", "full_name": "Dr. Sunita Rao", "role": "PATHOLOGIST", "password": "admin123"},
    {"email": "patient@gmail.com", "full_name": "Demo Patient", "role": "PATIENT", "password": "admin123"},
]


class Command(BaseCommand):
    help = "Seed the full test catalog, packages, pricing, and system accounts into the database."

    def handle(self, *args, **options):
        from laboratory.models import LaboratoryTest, TestPrice, Package, PackagePrice, PackageTest
        from accounts.models import User
        from patients.models import Patient
        from common.services.id_generator import generate_business_id

        self.stdout.write(self.style.MIGRATE_HEADING("=== Seeding Life Line Diagnostics Database ==="))

        with transaction.atomic():
            # ── 1. Tests ──────────────────────────────────────────────────
            self.stdout.write("\n📋 Seeding laboratory tests...")
            test_map = {}
            for t in TESTS:
                test_obj, created = LaboratoryTest.objects.get_or_create(
                    test_id=t["test_id"],
                    defaults={
                        "name": t["name"],
                        "category": t["category"],
                        "sample_type": t["sample_type"],
                        "is_active": True,
                    },
                )
                if not created:
                    test_obj.name = t["name"]
                    test_obj.category = t["category"]
                    test_obj.is_active = True
                    test_obj.save()

                TestPrice.objects.update_or_create(
                    laboratory_test=test_obj,
                    defaults={"walk_in_price": t["walk_in_price"]},
                )
                test_map[t["test_id"]] = test_obj
                status_str = "✓ Created" if created else "↻ Updated"
                self.stdout.write(f"  {status_str}: {t['name']} — ₹{t['walk_in_price']}")

            # ── 2. Packages ───────────────────────────────────────────────
            self.stdout.write("\n📦 Seeding packages...")
            for p in PACKAGES:
                pkg_obj, created = Package.objects.get_or_create(
                    package_id=p["package_id"],
                    defaults={
                        "name": p["name"],
                        "description": p["description"],
                        "is_active": True,
                    },
                )
                if not created:
                    pkg_obj.name = p["name"]
                    pkg_obj.description = p["description"]
                    pkg_obj.is_active = True
                    pkg_obj.save()

                PackagePrice.objects.update_or_create(
                    package=pkg_obj,
                    defaults={"walk_in_price": p["walk_in_price"]},
                )

                # Link tests to package
                PackageTest.objects.filter(package=pkg_obj).delete()
                for order, tid in enumerate(p["test_ids"], start=1):
                    if tid in test_map:
                        PackageTest.objects.create(
                            package=pkg_obj,
                            laboratory_test=test_map[tid],
                            display_order=order,
                        )

                status_str = "✓ Created" if created else "↻ Updated"
                self.stdout.write(f"  {status_str}: {p['name']} — ₹{p['walk_in_price']} ({len(p['test_ids'])} tests)")

            # ── 3. System Accounts ─────────────────────────────────────────
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
        self.stdout.write("   → 15 tests seeded with pricing")
        self.stdout.write("   → 3 packages seeded with pricing")
        self.stdout.write("   → System accounts ready")
        self.stdout.write("\n   Backend: http://127.0.0.1:8000")
        self.stdout.write("   Admin panel: http://127.0.0.1:8000/admin/")
