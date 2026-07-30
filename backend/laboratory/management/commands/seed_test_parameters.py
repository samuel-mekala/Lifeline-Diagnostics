from django.core.management.base import BaseCommand
from django.db import transaction
from common.services.id_generator import generate_business_id
from laboratory.models import LaboratoryTest, TestParameter

TEST_PARAMETERS = {
    "Complete Blood Picture (CBC)": [
        ("Hemoglobin", "g/dL", "Male: 13.5-17.5 | Female: 12.0-15.5"),
        ("RBC Count", "million/µL", "Male: 4.5-5.9 | Female: 4.1-5.1"),
        ("WBC Count", "/µL", "4000-11000"),
        ("Platelet Count", "/µL", "150000-450000"),
        ("PCV", "%", "Male: 41-53 | Female: 36-46"),
        ("MCV", "fL", "80-100"),
        ("MCH", "pg", "27-33"),
        ("MCHC", "g/dL", "32-36"),
    ],

    "ESR": [
        ("ESR", "mm/hr", "Male: 0-15 | Female: 0-20"),
    ],

    "HbA1c": [
        ("HbA1c", "%", "<5.7"),
    ],

    "Calcium, Serum": [
        ("Calcium", "mg/dL", "8.5-10.5"),
    ],

    "Testosterone": [
        ("Testosterone", "ng/dL", "300-1000"),
    ],

    "Vitamin B12": [
        ("Vitamin B12", "pg/mL", "200-900"),
    ],

    "Vitamin D Total": [
        ("Vitamin D Total", "ng/mL", "30-100"),
    ],

    "Iron Profile": [
        ("Serum Iron", "µg/dL", "60-170"),
        ("TIBC", "µg/dL", "240-450"),
        ("Transferrin Saturation", "%", "20-50"),
    ],

    "Kidney Function Mini Profile": [
        ("Urea", "mg/dL", "15-40"),
        ("Creatinine", "mg/dL", "0.6-1.3"),
        ("Uric Acid", "mg/dL", "Male: 3.4-7.0 | Female: 2.4-6.0"),
    ],

    "Lipid Profile": [
        ("Total Cholesterol", "mg/dL", "<200"),
        ("Triglycerides", "mg/dL", "<150"),
        ("HDL Cholesterol", "mg/dL", ">40"),
        ("LDL Cholesterol", "mg/dL", "<100"),
        ("VLDL Cholesterol", "mg/dL", "5-40"),
    ],

    "Liver Function Profile": [
        ("Total Bilirubin", "mg/dL", "0.3-1.2"),
        ("Direct Bilirubin", "mg/dL", "0.0-0.3"),
        ("Indirect Bilirubin", "mg/dL", "0.2-0.9"),
        ("SGOT (AST)", "U/L", "10-40"),
        ("SGPT (ALT)", "U/L", "7-56"),
        ("Alkaline Phosphatase", "U/L", "44-147"),
        ("Total Protein", "g/dL", "6.4-8.3"),
        ("Albumin", "g/dL", "3.5-5.0"),
        ("Globulin", "g/dL", "2.0-3.5"),
        ("A/G Ratio", "", "1.0-2.2"),
    ],

    "Complete Urine Examination (CUE)": [
        ("Colour", "", "Yellow"),
        ("Appearance", "", "Clear"),
        ("Specific Gravity", "", "1.005-1.030"),
        ("pH", "", "5.0-8.0"),
        ("Protein", "", "Negative"),
        ("Glucose", "", "Negative"),
        ("Ketones", "", "Negative"),
        ("Blood", "", "Negative"),
        ("Pus Cells", "/HPF", "0-5"),
        ("Epithelial Cells", "/HPF", "0-5"),
    ],

    "Thyroid Profile I": [
        ("T3", "ng/dL", "80-200"),
        ("T4", "µg/dL", "5-12"),
        ("TSH", "µIU/mL", "0.4-4.0"),
    ],

    "FBS": [
        ("Glucose", "mg/dL", "70-99"),
    ],

    "PPBS": [
        ("Glucose", "mg/dL", "<140"),
    ],

    "RBS": [
        ("Glucose", "mg/dL", "70-140"),
    ],
}


class Command(BaseCommand):
    help = "Seed laboratory test parameters"

    @transaction.atomic
    def handle(self, *args, **options):
        for test_name, parameters in TEST_PARAMETERS.items():
            laboratory_test = LaboratoryTest.objects.get(name=test_name)

            for order, (name, unit, reference_range) in enumerate(parameters, start=1):
                parameter, created = TestParameter.objects.get_or_create(
                    laboratory_test=laboratory_test,
                    name=name,
                    defaults={
                        "parameter_id": generate_business_id(
                            model=TestParameter,
                            field="parameter_id",
                            prefix="PAR",
                        ),
                        "display_order": order,
                        "unit": unit,
                        "reference_range": reference_range,
                        "is_active": True,
                    },
                )

                if not created:
                    parameter.display_order = order
                    parameter.unit = unit
                    parameter.reference_range = reference_range
                    parameter.is_active = True

                    parameter.save(
                        update_fields=[
                            "display_order",
                            "unit",
                            "reference_range",
                            "is_active",
                        ]
                    )

        self.stdout.write(
            self.style.SUCCESS("Test parameters seeded successfully.")
        )