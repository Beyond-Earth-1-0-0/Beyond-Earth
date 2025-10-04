FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/server

ENV PYTHONPATH=/app

EXPOSE 5500

CMD ["uvicorn", "server.upload_service.main:app", "--host", "0.0.0.0", "--port", "5500"]