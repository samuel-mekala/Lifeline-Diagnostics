from io import BytesIO

import fitz
from reportlab.lib.utils import ImageReader
class LetterheadRenderer:

    _background = None

    @classmethod
    def get_background(cls, path):

        if cls._background:
            return cls._background

        pdf = fitz.open(path)

        page = pdf.load_page(0)

        pix = page.get_pixmap(
            matrix=fitz.Matrix(2, 2),
            alpha=False,
        )

        image = BytesIO(
            pix.tobytes("png")
        )

        cls._background = ImageReader(image)

        return cls._background