# Lifeline Diagnostics

Django REST Framework Laboratory Information Management System (LIMS).

## Environment

Copy `.env.example` to your deployment environment and set its variables there. The
application reads operating-system environment variables; it does not load `.env`
files automatically. Never commit real secrets.

Required production values:

- `SECRET_KEY`: a unique secret value.
- `DEBUG=False`
- `ALLOWED_HOSTS`: comma-separated public hostnames.
- `DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT` for MySQL.
- `SECURE_SSL_REDIRECT=True`, `SESSION_COOKIE_SECURE=True`, and `CSRF_COOKIE_SECURE=True` when HTTPS is terminated for the application.
- `SECURE_PROXY_SSL_HEADER=True` only when the reverse proxy sets `X-Forwarded-Proto` correctly.

SQLite remains the default for local development. For MySQL, set:

```bash
export DB_ENGINE=django.db.backends.mysql
export DB_NAME=lifeline_diagnostics
export DB_USER=lifeline
export DB_PASSWORD='replace-me'
export DB_HOST=127.0.0.1
export DB_PORT=3306
```

## Development setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Run verification with:

```bash
python manage.py check
python manage.py test
```

The unauthenticated health check is available at `GET /health/`.

## Production preparation

Set production environment variables, then run:

```bash
python manage.py migrate
python manage.py collectstatic --noinput
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

`STATIC_ROOT` is `staticfiles/` and `MEDIA_ROOT` is `media/`. Configure the reverse
proxy or static-file host to serve `/static/` and `/media/` in production. Application,
warning, and error logs are written to `logs/`.
