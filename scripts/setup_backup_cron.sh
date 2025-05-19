#!/bin/bash
# Setup cron job for daily backups
# Run this script once to set up the backup

# Make the backup script executable
chmod +x /app/scripts/db_backup.sh

# Create a cron entry for daily backups at 2 AM
echo "0 2 * * * /app/scripts/db_backup.sh >> /app/backups/backup.log 2>&1" | crontab -

# Verify cron installation and setup
if command -v crontab >/dev/null 2>&1; then
    echo "Cron job installed successfully. Backups will run daily at 2 AM."
    echo "Current crontab:"
    crontab -l
else
    echo "Error: cron not found. Please install cron with: apt-get install cron"
    exit 1
fi