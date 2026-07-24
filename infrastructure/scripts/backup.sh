#!/bin/bash
set -e

BACKUP_DIR="/opt/ummah-directory/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="${POSTGRES_DB:-ummah_directory}"
DB_USER="${POSTGRES_USER:-ummah}"
RETENTION_DAYS=30

echo "=== Backup: $DATE ==="

# Database backup
docker exec ummah-directory_postgres_1 pg_dump -U "$DB_USER" "$DB_NAME" \
    --format=custom \
    --file="/tmp/backup_$DATE.dump"

docker cp "ummah-directory_postgres_1:/tmp/backup_$DATE.dump" "$BACKUP_DIR/db_$DATE.dump"
docker exec ummah-directory_postgres_1 rm "/tmp/backup_$DATE.dump"

# Compress
gzip "$BACKUP_DIR/db_$DATE.dump"

# Cleanup old backups
find "$BACKUP_DIR" -name "db_*.dump.gz" -mtime +$RETENTION_DAYS -delete

echo "=== Backup complete: db_$DATE.dump.gz ==="
