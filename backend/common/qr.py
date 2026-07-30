from io import BytesIO

import qrcode


def qr_image(url):
    image = qrcode.make(url)
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer
