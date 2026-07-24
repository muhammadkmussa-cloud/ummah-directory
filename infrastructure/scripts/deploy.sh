#!/bin/bash
set -e

echo "=== Deploying ummah Directory ==="

cd /opt/ummah-directory

# Pull latest images
docker compose -f docker-compose.prod.yml pull

# Apply database migrations
docker compose -f docker-compose.prod.yml run --rm backend alembic upgrade head

# Restart services with zero-downtime
docker compose -f docker-compose.prod.yml up -d --no-deps --scale backend=2 backend
sleep 5
docker compose -f docker-compose.prod.yml up -d --no-deps frontend
docker compose -f docker-compose.prod.yml up -d --no-deps celery-worker celery-beat

# Remove old backend containers
docker container prune -f

echo "=== Deploy complete ==="
