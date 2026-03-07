#!/bin/sh
# ============================================================
#  MongoDB Daily Backup Script
#  Usage: ./scripts/backup.sh
#  Schedule with cron: 0 2 * * * /app/scripts/backup.sh
# ============================================================

set -e

BACKUP_DIR=${BACKUP_DIR:-"/backups"}
MONGO_URI=${MONGO_URI:?"MONGO_URI must be set"}
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/${DATE}"
RETENTION_DAYS=${RETENTION_DAYS:-7}

echo "📦 Starting MongoDB backup — ${DATE}"

# Create backup directory
mkdir -p "${BACKUP_PATH}"

# Dump database
mongodump --uri="${MONGO_URI}" --out="${BACKUP_PATH}"

# Compress the backup
tar -czf "${BACKUP_PATH}.tar.gz" -C "${BACKUP_DIR}" "${DATE}"
rm -rf "${BACKUP_PATH}"

echo "✅ Backup created: ${BACKUP_PATH}.tar.gz"

# Prune backups older than RETENTION_DAYS
find "${BACKUP_DIR}" -name "*.tar.gz" -mtime "+${RETENTION_DAYS}" -exec rm {} \;
echo "🧹 Pruned backups older than ${RETENTION_DAYS} days"
echo "🎉 Backup complete"
