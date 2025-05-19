#!/bin/bash
# PostgreSQL Database Restore Script

# Check if backup file is specified
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 backups/postgres_backup_20250314.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"
DB_CONTAINER="boost_db"
DB_NAME="boost_twitch"
DB_USER="boost_twitch"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file $BACKUP_FILE not found!"
    exit 1
fi

# Confirm before proceeding
echo "WARNING: This will overwrite the current database with the backup."
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
read -p "Are you sure you want to proceed? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "Operation cancelled."
    exit 0
fi

# Extract if it's a gzipped file
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Extracting gzipped backup..."
    gunzip -c "$BACKUP_FILE" > "${BACKUP_FILE%.gz}"
    BACKUP_FILE="${BACKUP_FILE%.gz}"
fi

echo "Restoring database from $BACKUP_FILE..."

# Restore the database
cat "$BACKUP_FILE" | docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME

# Check if restore was successful
if [ $? -eq 0 ]; then
    echo "Database restored successfully!"
else
    echo "Error restoring database!"
    exit 1
fi