import logging

from rest_framework import status
from rest_framework.exceptions import (
    AuthenticationFailed,
    NotAuthenticated,
    NotFound,
    PermissionDenied,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler


logger = logging.getLogger("lifeline")


def _error_type(exception):
    if isinstance(exception, ValidationError):
        return "validation_error"
    if isinstance(exception, NotFound):
        return "not_found"
    if isinstance(exception, PermissionDenied):
        return "permission_denied"
    if isinstance(exception, (AuthenticationFailed, NotAuthenticated)):
        return "authentication_failed"
    return "api_error"


def _error_message(data):
    if isinstance(data, dict):
        detail = data.get("detail", data)
    else:
        detail = data

    if isinstance(detail, list):
        return "; ".join(str(item) for item in detail)
    if isinstance(detail, dict):
        return "; ".join(
            f"{field}: {', '.join(str(item) for item in messages)}"
            for field, messages in detail.items()
        )
    return str(detail)


def custom_exception_handler(exception, context):
    from accounts.models import User
    if isinstance(exception, User.DoesNotExist):
        return Response(
            {
                "success": False,
                "error": {
                    "type": "authentication_failed",
                    "message": "Token is invalid or user no longer exists.",
                },
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    response = exception_handler(exception, context)

    if response is None:
        logger.error(
            "Unhandled API exception",
            exc_info=(type(exception), exception, exception.__traceback__),
        )
        return Response(
            {
                "success": False,
                "error": {
                    "type": "server_error",
                    "message": f"Server Error: {type(exception).__name__}: {str(exception)}",
                },
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


    response.data = {
        "success": False,
        "error": {
            "type": _error_type(exception),
            "message": _error_message(response.data),
        },
    }
    return response
