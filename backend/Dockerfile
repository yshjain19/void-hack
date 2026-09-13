FROM python:3.12-slim

WORKDIR /app

# System deps for psycopg2, lxml, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libxml2-dev \
    libxslt-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-local.txt .
RUN pip install --no-cache-dir -r requirements-local.txt

COPY . .

RUN mkdir -p /app/uploads /app/reports

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
