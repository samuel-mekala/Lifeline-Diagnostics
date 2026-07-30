from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from common.qr import qr_image


class InvoicePDFGenerator:
    @staticmethod
    def generate(invoice, verification_url):
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=18 * mm, bottomMargin=18 * mm)
        styles = getSampleStyleSheet()
        rows = [["Item", "Qty", "Unit price", "Discount", "Total"]]
        for item in invoice.items.all():
            rows.append([item.item_name, str(item.quantity), f"₹{item.unit_price:.2f}", f"₹{item.discount:.2f}", f"₹{item.line_total:.2f}"])
        rows.extend([["", "", "Subtotal", "", f"₹{invoice.subtotal:.2f}"], ["", "", "Discount", "", f"₹{invoice.discount:.2f}"], ["", "", "Total", "", f"₹{invoice.total_amount:.2f}"]])
        table = Table(rows, colWidths=[70 * mm, 16 * mm, 28 * mm, 28 * mm, 28 * mm])
        table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F4E79")), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("GRID", (0, 0), (-1, -1), 0.25, colors.grey), ("ALIGN", (1, 1), (-1, -1), "RIGHT"), ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#E8F1F8"))]))
        story = [Paragraph("<b>LIFELINE DIAGNOSTICS</b>", styles["Title"]), Paragraph("INVOICE", styles["Heading2"]), Spacer(1, 8), Paragraph(f"Invoice ID: {invoice.invoice_id}<br/>Status: {invoice.status}<br/>Issued: {invoice.created_at:%d-%b-%Y %I:%M %p}", styles["BodyText"]), Spacer(1, 14), table, Spacer(1, 14), Paragraph("Scan the QR code or use the verification link to confirm this invoice.", styles["BodyText"])]
        qr = Image(qr_image(verification_url), width=32 * mm, height=32 * mm)
        qr_table = Table([[qr, Paragraph(verification_url, styles["BodyText"])]], colWidths=[36 * mm, 130 * mm])
        story.append(qr_table)
        doc.build(story)
        buffer.seek(0)
        return buffer
