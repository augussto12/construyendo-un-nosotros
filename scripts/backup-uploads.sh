#!/usr/bin/env sh
set -eu

BACKUP_ROOT="${BACKUP_ROOT:-./backups}"
BACKUP_DIR="${BACKUP_ROOT}/uploads"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="construyendo-uploads-${TIMESTAMP}.tar.gz"

mkdir -p "$BACKUP_DIR"
BACKUP_DIR_ABS="$(cd "$BACKUP_DIR" && pwd)"

echo "Creating uploads backup at ${BACKUP_DIR_ABS}/${BACKUP_FILE}"
docker run --rm \
  -v construyendo_uploads:/data:ro \
  -v "${BACKUP_DIR_ABS}:/backup" \
  alpine:3.20 \
  tar -czf "/backup/${BACKUP_FILE}" -C /data .
echo "Uploads backup completed."
