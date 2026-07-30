from django.db import DatabaseError, connection


class HealthService:
    VERSION = "1.0.0"

    @staticmethod
    def get_status():
        try:
            connection.ensure_connection()
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except DatabaseError:
            return {
                "status": "unhealthy",
                "database": "unavailable",
                "version": HealthService.VERSION,
            }, False

        return {
            "status": "healthy",
            "database": "ok",
            "version": HealthService.VERSION,
        }, True
