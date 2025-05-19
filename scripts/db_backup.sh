#!/bin/bash
# PostgreSQL Database Backup Script

# Configuration
BACKUP_DIR="/app/backups"
BACKUP_RETENTION=2  # Keep this many days of backups
DB_CONTAINER="boost_db"
DB_NAME="boost_twitch"
DB_USER="boost_twitch"
TIMESTAMP=$(date +"%Y%m%d")
BACKUP_FILE="${BACKUP_DIR}/postgres_backup_${TIMESTAMP}.sql"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Create backup
echo "Creating database backup: $BACKUP_FILE"
docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup created successfully"

    # Compress the backup file
    gzip -f "$BACKUP_FILE"
    echo "Backup compressed: ${BACKUP_FILE}.gz"

    # Delete old backups (keeping only the most recent based on BACKUP_RETENTION)
    echo "Cleaning up old backups..."
    find "$BACKUP_DIR" -name "postgres_backup_*.sql.gz" -type f -mtime +$BACKUP_RETENTION -delete

    echo "Backup process completed successfully"
else
    echo "Error creating backup"
    exit 1
fi