#!/usr/bin/env sh
set -eu

COMPOSE="docker compose --env-file .env.vps -f docker-compose.vps-ip.yml"
BACKUP_ROOT="${BACKUP_ROOT:-./backups}"
BACKUP_DIR="${BACKUP_ROOT}/db"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

if [ ! -f .env.vps ]; then
  echo "Missing .env.vps." >&2
  exit 1
fi

POSTGRES_DB="$(awk -F= '/^POSTGRES_DB=/{print $2}' .env.vps | tail -n 1)"
POSTGRES_USER="$(awk -F= '/^POSTGRES_USER=/{print $2}' .env.vps | tail -n 1)"

if [ -z "$POSTGRES_DB" ] || [ -z "$POSTGRES_USER" ]; then
  echo "POSTGRES_DB and POSTGRES_USER must be set in .env.vps." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
BACKUP_FILE="${BACKUP_DIR}/construyendo-${TIMESTAMP}.dump"

echo "Creating database backup at ${BACKUP_FILE}"
$COMPOSE exec -T construyendo_postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$BACKUP_FILE"
echo "Database backup completed."
