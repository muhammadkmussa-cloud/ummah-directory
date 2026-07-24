#!/bin/bash
set -e

BACKUP_FILE=$1
if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore.sh <backup_file>"
    exit 1
fi

DB_NAME="${POSTGRES_DB:-ummah_directory}"
DB_USER="${POSTGRES_USER:-ummah}"

echo "=== Restoring: $BACKUP_FILE ==="

gunzip -c "$BACKUP_FILE" > /tmp/restore_temp.dump
docker cp /tmp/restore_temp.dump ummah-directory_postgres_1:/tmp/restore.dump
docker exec ummah-directory_postgres_1 pg_restore -U "$DB_USER" -d "$DB_NAME" \
    --clean --if-exists \
    /tmp/restore.dump
rm /tmp/restore_temp.dump

echo "=== Restore complete ==="
