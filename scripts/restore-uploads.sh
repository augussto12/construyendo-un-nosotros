#!/usr/bin/env sh
set -eu

if [ "${CONFIRM_RESTORE:-}" != "YES" ]; then
  echo "Refusing to restore uploads. Re-run with CONFIRM_RESTORE=YES and pass the tar.gz path." >&2
  exit 1
fi

if [ $# -ne 1 ]; then
  echo "Usage: CONFIRM_RESTORE=YES sh scripts/restore-uploads.sh ./backups/uploads/file.tar.gz" >&2
  exit 1
fi

ARCHIVE_PATH="$1"
if [ ! -f "$ARCHIVE_PATH" ]; then
  echo "Uploads archive not found: $ARCHIVE_PATH" >&2
  exit 1
fi

ARCHIVE_DIR="$(cd "$(dirname "$ARCHIVE_PATH")" && pwd)"
ARCHIVE_FILE="$(basename "$ARCHIVE_PATH")"

echo "Restoring uploads from ${ARCHIVE_PATH}. Existing upload files will be removed first."
docker run --rm \
  -v construyendo_uploads:/data \
  -v "${ARCHIVE_DIR}:/backup:ro" \
  alpine:3.20 \
  sh -c 'rm -rf /data/* /data/.[!.]* /data/..?* 2>/dev/null || true; tar -xzf "/backup/$0" -C /data' "$ARCHIVE_FILE"
echo "Uploads restore completed."
