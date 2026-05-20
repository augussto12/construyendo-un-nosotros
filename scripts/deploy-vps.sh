#!/usr/bin/env sh
set -eu

COMPOSE="docker compose --env-file .env.vps -f docker-compose.vps-ip.yml"

if [ ! -f .env.vps ]; then
  echo "Missing .env.vps. Copy .env.vps.example to .env.vps and edit it first." >&2
  exit 1
fi

FRONTEND_PUBLIC_PORT="$(awk -F= '/^FRONTEND_PUBLIC_PORT=/{print $2}' .env.vps | tail -n 1)"
FRONTEND_PUBLIC_PORT="${FRONTEND_PUBLIC_PORT:-8096}"

echo "Validating compose configuration..."
$COMPOSE config >/dev/null

if $COMPOSE ps -q construyendo_postgres >/dev/null 2>&1 && [ -n "$($COMPOSE ps -q construyendo_postgres 2>/dev/null)" ]; then
  echo "Running pre-deploy backups..."
  sh scripts/backup-db.sh || echo "Database backup failed or database is not ready yet. Continue only if this is the first deploy."
  sh scripts/backup-uploads.sh || echo "Uploads backup failed or uploads volume does not exist yet. Continue only if this is the first deploy."
else
  echo "Postgres container is not running yet; skipping pre-deploy backups for first deploy."
fi

echo "Starting database..."
$COMPOSE up -d construyendo_postgres

echo "Applying EF Core migrations..."
sh scripts/migrate-vps.sh

echo "Building and starting API and frontend..."
$COMPOSE up -d --build construyendo_api construyendo_frontend

check_url() {
  url="$1"
  echo "Checking $url"
  if ! curl -fsS "$url" >/dev/null; then
    echo "Health check failed: $url" >&2
    $COMPOSE logs --tail=120 construyendo_api construyendo_frontend construyendo_postgres >&2
    exit 1
  fi
}

check_url "http://localhost:${FRONTEND_PUBLIC_PORT}/health-frontend"
check_url "http://localhost:${FRONTEND_PUBLIC_PORT}/api/health"
check_url "http://localhost:${FRONTEND_PUBLIC_PORT}/api/public/ping"

echo "Deploy completed. Open http://IP_VPS:${FRONTEND_PUBLIC_PORT}"
