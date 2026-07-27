TEST_CATEGORY_CHOICES = [
    ("HEMATOLOGY", "Hematology"),
    ("BIOCHEMISTRY", "Biochemistry"),
    ("IMMUNOLOGY", "Immunology"),
    ("MICROBIOLOGY", "Microbiology"),
    ("PATHOLOGY", "Pathology"),
]

SAMPLE_TYPE_CHOICES = [
    ("BLOOD", "Blood"),
    ("URINE", "Urine"),
    ("STOOL", "Stool"),
    ("SERUM", "Serum"),
    ("PLASMA", "Plasma"),
    ("SWAB", "Swab"),
]

ORDERED_TEST_STATUS_CHOICES = [
    ("PENDING", "Pending"),
    ("SAMPLE_COLLECTED", "Sample Collected"),
    ("IN_PROGRESS", "In Progress"),
    ("COMPLETED", "Completed"),
    ("CANCELLED", "Cancelled"),
]

SAMPLE_STATUS_CHOICES = [
    ("PENDING", "Pending"),
    ("COLLECTED", "Collected"),
    ("REJECTED", "Rejected"),
]