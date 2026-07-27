from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape
BASE_DIR = Path(__file__).resolve().parent

LETTERHEAD = BASE_DIR / "assets" / "letterhead.pdf"
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reports.utils.letterhead import LetterheadRenderer
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Canvas that prints 'Page X of Y'
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total_pages = len(self._saved_page_states)

        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(total_pages)
            super().showPage()

        super().save()

    def draw_page_number(self, total_pages):
        self.setFont("Helvetica", 8)

        self.drawRightString(
            555,
            18,
            f"Page {self._pageNumber} of {total_pages}"
        )


class ReportPDFGenerator:

    PAGE_LEFT = 42
    PAGE_RIGHT = 42
    PAGE_TOP = 118
    PAGE_BOTTOM = 105

    TABLE_HEADER = colors.HexColor("#D9EAF7")
    LABEL_BG = colors.HexColor("#F5F8FC")
    ROW_ALT = colors.HexColor("#FAFAFA")
    BLUE = colors.HexColor("#1F4E79")

    @staticmethod
    def _text(value, default="-"):
        return escape(str(value if value not in (None, "") else default))

    @staticmethod
    def validate_report_data(report_data):
        required_keys = {"patient", "visit", "report", "results"}
        if not isinstance(report_data, dict):
            raise ValueError("Report data must be a dictionary.")

        missing_keys = required_keys.difference(report_data)
        if missing_keys:
            raise ValueError(
                "Report data is missing required fields: "
                + ", ".join(sorted(missing_keys))
                + "."
            )

        results = list(report_data["results"])
        if not results:
            raise ValueError("Cannot generate a PDF without approved results.")
        if any(result.status != "APPROVED" for result in results):
            raise ValueError("Cannot generate a PDF with unapproved results.")

        return results

    @staticmethod
    def generate(report_data, include_header=True):
        results = ReportPDFGenerator.validate_report_data(report_data)

        buffer = BytesIO()

        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=ReportPDFGenerator.PAGE_LEFT,
            rightMargin=ReportPDFGenerator.PAGE_RIGHT,
            topMargin=ReportPDFGenerator.PAGE_TOP,
            bottomMargin=ReportPDFGenerator.PAGE_BOTTOM,
        )

        styles = ReportPDFGenerator.get_styles()

        elements = []

        patient = report_data["patient"]
        visit = report_data["visit"]
        report = report_data["report"]

        if not include_header:
            ReportPDFGenerator.build_title(
                elements,
                styles,
            )

        ReportPDFGenerator.build_patient_information(
            elements,
            styles,
            patient,
            visit,
            report,
        )

        ReportPDFGenerator.build_result_sections(
            elements,
            styles,
            results,
        )
#-----------------
        doc.build(
            elements,
            canvasmaker=NumberedCanvas,
            onFirstPage=ReportPDFGenerator.draw_letterhead,
            onLaterPages=ReportPDFGenerator.draw_letterhead,
        )

        buffer.seek(0)

        return buffer

    @staticmethod
    def get_styles():

        styles = getSampleStyleSheet()

        styles.add(
            ParagraphStyle(
                name="SectionTitle",
                parent=styles["Heading2"],
                fontName="Helvetica-Bold",
                fontSize=13,
                leading=15,
                spaceBefore=18,
                spaceAfter=10,
                textColor=ReportPDFGenerator.BLUE,
            )
        )

        styles.add(
            ParagraphStyle(
                name="DepartmentTitle",
                parent=styles["Heading2"],
                fontName="Helvetica-Bold",
                fontSize=12,
                alignment=TA_CENTER,
                textColor=colors.white,
                spaceBefore=0,
                spaceAfter=0,
            )
        )

        styles.add(
            ParagraphStyle(
                name="NormalCell",
                parent=styles["BodyText"],
                fontName="Helvetica",
                fontSize=9,
                leading=12,
            )
        )

        styles.add(
            ParagraphStyle(
                name="Label",
                parent=styles["BodyText"],
                fontName="Helvetica-Bold",
                fontSize=9,
            )
        )

        styles.add(
            ParagraphStyle(
                name="Value",
                parent=styles["BodyText"],
                fontName="Helvetica",
                fontSize=9,
            )
        )

        styles["Title"].fontSize = 17
        styles["Title"].leading = 19
        styles["Title"].alignment = TA_CENTER
        styles["Title"].textColor = ReportPDFGenerator.BLUE

        return styles

    @staticmethod
    def build_title(elements, styles):

        elements.append(
            Paragraph(
                "<b>LABORATORY TEST REPORT</b>",
                styles["Title"],
            )
        )

        elements.append(
            Spacer(1, 15)
        )

#------------------------------------------#
    @staticmethod
    def build_patient_information(
        
        elements,
        styles,
        patient,
        visit,
        report,
    ):

        generated_at = (
            report.generated_at.strftime("%d-%b-%Y %I:%M %p")
            if report.generated_at
            else "-"
        )

        status = (
            str(report.status).replace("_", " ").title()
            if report.status
            else "-"
        )

        elements.append(
            Spacer(1,24)
        )

        data = [

            [
                Paragraph("<b>Patient Name</b>", styles["Label"]),
                Paragraph(ReportPDFGenerator._text(patient.full_name), styles["Value"]),

                Paragraph("<b>Report ID</b>", styles["Label"]),
                Paragraph(ReportPDFGenerator._text(report.report_id), styles["Value"]),
            ],

            [
                Paragraph("<b>Patient ID</b>", styles["Label"]),
                Paragraph(ReportPDFGenerator._text(patient.patient_id), styles["Value"]),

                Paragraph("<b>Visit ID</b>", styles["Label"]),
                Paragraph(ReportPDFGenerator._text(visit.visit_id), styles["Value"]),
            ],

            [
                Paragraph("<b>Age / Gender</b>", styles["Label"]),
                Paragraph(
                    f"{patient.age} Years / {patient.gender_display}",
                    styles["Value"],
                ),

                Paragraph("<b>Generated On</b>", styles["Label"]),
                Paragraph(ReportPDFGenerator._text(generated_at), styles["Value"]),
            ],

            [
                Paragraph("<b>Phone</b>", styles["Label"]),
                Paragraph(ReportPDFGenerator._text(patient.phone), styles["Value"]),

                Paragraph("<b>Status</b>", styles["Label"]),
                Paragraph(ReportPDFGenerator._text(status), styles["Value"]),
            ],

            [
                Paragraph("<b>Address</b>", styles["Label"]),
                Paragraph(
                    ReportPDFGenerator._text(patient.address),
                    styles["Value"],
                ),

                "",
                "",
            ],
        ]

        table = Table(
            data,
            colWidths=[70, 170, 70, 170],
        )

        table.setStyle(
            TableStyle(

                [

                    ("BACKGROUND", (0, 0), (0, -1),
                    ReportPDFGenerator.LABEL_BG),

                    ("BACKGROUND", (2, 0), (2, 3),
                    ReportPDFGenerator.LABEL_BG),

                    ("LINEABOVE",
                        (0,0),
                        (-1,0),
                        0.5,
                        colors.HexColor("#CFCFCF")),

                    ("LINEBELOW", (0, 0), (-1, -1),
                    0.25,
                    colors.HexColor("#D8D8D8")),

                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),

                    ("TOPPADDING", (0, 0), (-1, -1), 8),

                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),

                    ("LEFTPADDING", (0, 0), (-1, -1), 8),

                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),

                    ("SPAN", (1, 4), (3, 4)),

                ]
            )
        )

        elements.append(table)
        elements.append(
            Spacer(1,18)
)

#-----------------------#
    @staticmethod
    def build_result_sections(
        elements,
        styles,
        results,
    ):

        if not results:

            elements.append(
                Paragraph(
                    "No approved laboratory results available.",
                    styles["BodyText"],
                )
            )
            return

        for result in results:

            elements.append(
                Spacer(1, 8)
            )

            # Department Banner
            banner = Table(
                [[
                    Paragraph(
                        f"<b>{ReportPDFGenerator._text(result.ordered_test.laboratory_test.name.upper())}</b>",
                        styles["DepartmentTitle"],
                    )
                ]],
                colWidths=[470],
            )

            banner.setStyle(
                TableStyle(
                    [
                        ("BOX",(0,0),(-1,-1),0.6,colors.HexColor("#1B4367")),
                        ("BOTTOMPADDING",(0,0),(-1,-1),9),
                        ("TOPPADDING",(0,0),(-1,-1),9),
                        ("BACKGROUND", (0, 0), (-1, -1),
                        ReportPDFGenerator.BLUE),

                        ("ALIGN", (0, 0), (-1, -1), "CENTER"),

                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ]
                )
            )




            elements.append(banner)

            elements.append(
                Spacer(1, 10)
            )

            ReportPDFGenerator.build_result_table(
                elements,
                result,
            )

            elements.append(
                Spacer(1, 20)
            )

#---------------------------------------------
    @staticmethod
    def build_result_table(elements, result):

        rows = [[
            Paragraph("<b>Test Description</b>",
                    getSampleStyleSheet()["BodyText"]),
            Paragraph("<b>Result</b>",
                    getSampleStyleSheet()["BodyText"]),
            Paragraph("<b>Unit</b>",
                    getSampleStyleSheet()["BodyText"]),
            Paragraph("<b>Reference Range</b>",
                    getSampleStyleSheet()["BodyText"]),
        ]]

        parameters = list(
            result.parameters.all()
        )

        for parameter in parameters:

            value = parameter.display_value

            rows.append(
                [
                    Paragraph(
                        ReportPDFGenerator._text(parameter.test_parameter.name),
                        getSampleStyleSheet()["BodyText"],
                    ),
                    Paragraph(
                        f"<b>{ReportPDFGenerator._text(value)}</b>"
                        if parameter.flag
                        else str(value),
                        getSampleStyleSheet()["BodyText"],
                    ),
                    Paragraph(
                        ReportPDFGenerator._text(parameter.test_parameter.unit),
                        getSampleStyleSheet()["BodyText"],
                    ),
                    Paragraph(
                        ReportPDFGenerator._text(parameter.reference_range),
                        getSampleStyleSheet()["BodyText"],
                    ),
                ]
            )

        table = Table(
            rows,
            colWidths=[220, 70, 70, 110],
            repeatRows=1,
        )

        style = [

            ("BOX",(0,0),(-1,-1),0.6,colors.HexColor("#BFBFBF")),

            ("INNERGRID",(0,0),(-1,-1),0.25,colors.HexColor("#E5E5E5")),

            ("BACKGROUND", (0, 0), (-1, 0),
            ReportPDFGenerator.TABLE_HEADER),

            ("FONTNAME", (0, 0), (-1, 0),
            "Helvetica-Bold"),

            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),

            ("TOPPADDING", (0, 1), (-1, -1), 8),

            ("BOTTOMPADDING", (0, 1), (-1, -1), 8),

            ("ALIGN",(1,1),(2,-1),"CENTER"),
            ("ALIGN",(3,1),(3,-1),"CENTER"),


            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]

        for row, parameter in enumerate(parameters, start=1):

            if row % 2 == 0:

                style.append(

                    ("BACKGROUND",
                    (0, row),
                    (-1, row),
                    ReportPDFGenerator.ROW_ALT)
                )

            if parameter.flag == parameter.Flag.HIGH:

                style.extend(
                    [

                        ("TEXTCOLOR",
                        (1, row),
                        (1, row),
                        colors.red),

                        ("FONTNAME",
                        (1, row),
                        (1, row),
                        "Helvetica-Bold"),

                    ]
                )

            elif parameter.flag == parameter.Flag.LOW:

                style.extend(
                    [

                        ("TEXTCOLOR",
                        (1, row),
                        (1, row),
                        colors.blue),

                        ("FONTNAME",
                        (1, row),
                        (1, row),
                        "Helvetica-Bold"),

                    ]
                )

        table.setStyle(
            TableStyle(style)
        )

        elements.append(table)
#---------------------------------

    @staticmethod
    def draw_letterhead(canvas_obj, doc):

        background = LetterheadRenderer.get_background(
            LETTERHEAD
        )

        canvas_obj.saveState()

        canvas_obj.drawImage(
            background,
            0,
            0,
            width=doc.pagesize[0],
            height=doc.pagesize[1],
        )

        page_width = doc.pagesize[0]

        # -----------------------------
        # Disclaimer
        # -----------------------------

        canvas_obj.setFont(
            "Helvetica",
            7,
        )

        canvas_obj.setFillColor(
            colors.HexColor("#555555")
        )

        canvas_obj.drawCentredString(
            page_width / 2,
            54,
            "This is a computer generated laboratory report. Clinical correlation is advised."
        )

        # -----------------------------
        # Signature Lines
        # -----------------------------

        y = 72

        canvas_obj.setStrokeColor(
            colors.HexColor("#999999")
        )

        canvas_obj.line(
            60,
            y,
            170,
            y,
        )

        canvas_obj.line(
            page_width - 170,
            y,
            page_width - 60,
            y,
        )

        canvas_obj.setFont(
            "Helvetica-Bold",
            8,
        )

        canvas_obj.setFillColor(
            colors.black
        )

        canvas_obj.drawCentredString(
            115,
            y - 12,
            "Lab Technician",
        )

        canvas_obj.drawCentredString(
            page_width - 115,
            y - 12,
            "Consultant Pathologist",
        )

        canvas_obj.restoreState()
