#!/usr/bin/env sh
set -eu

COMPOSE="docker compose --env-file .env.vps -f docker-compose.vps-ip.yml"

if [ "${CONFIRM_RESTORE:-}" != "YES" ]; then
  echo "Refusing to restore DB. Re-run with CONFIRM_RESTORE=YES and pass the dump path." >&2
  exit 1
fi

if [ $# -ne 1 ]; then
  echo "Usage: CONFIRM_RESTORE=YES sh scripts/restore-db.sh ./backups/db/file.dump" >&2
  exit 1
fi

if [ ! -f .env.vps ]; then
  echo "Missing .env.vps." >&2
  exit 1
fi

DUMP_FILE="$1"
if [ ! -f "$DUMP_FILE" ]; then
  echo "Dump file not found: $DUMP_FILE" >&2
  exit 1
fi

POSTGRES_DB="$(awk -F= '/^POSTGRES_DB=/{print $2}' .env.vps | tail -n 1)"
POSTGRES_USER="$(awk -F= '/^POSTGRES_USER=/{print $2}' .env.vps | tail -n 1)"

echo "Restoring database from ${DUMP_FILE}. Existing database objects may be replaced."
cat "$DUMP_FILE" | $COMPOSE exec -T construyendo_postgres pg_restore --clean --if-exists -U "$POSTGRES_USER" -d "$POSTGRES_DB"
echo "Database restore completed."
