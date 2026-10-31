FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

RUN DJANGO_SECRET_KEY=build-only DJANGO_ALLOWED_HOSTS=build python manage.py collectstatic --noinput \
    && useradd --create-home --uid 10001 app \
    && mkdir -p media \
    && chown -R app /app

USER app
EXPOSE 8000

# timeout > INFERENCE_TIMEOUT_SECONDS
CMD ["sh", "-c", "python manage.py migrate --noinput && exec gunicorn superray.wsgi --bind 0.0.0.0:8000 --workers 2 --timeout 180"]
