# Stage 1: Build Frontend Single Page App
FROM node:20-alpine AS frontend-builder
WORKDIR /build

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Runtime
FROM python:3.12-slim

# Install system dependencies (curl for healthcheck, gosu for privilege dropping)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gosu \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY backend/app ./app

# Copy compiled frontend assets from build stage
COPY --from=frontend-builder /build/dist /app/static

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    DATA_DIR=/app/data \
    STATIC_DIR=/app/static \
    CONTAINER=true \
    PORT=8000

EXPOSE 8000

VOLUME ["/app/data"]

ENTRYPOINT ["/entrypoint.sh"]
