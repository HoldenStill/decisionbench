#!/bin/sh
set -e

# Default user and group IDs for TrueNAS SCALE host-path compatibility
PUID=${PUID:-1000}
PGID=${PGID:-1000}

echo "=== DecisionBench Starting ==="
echo "Configuring permissions with PUID=${PUID} and PGID=${PGID}..."

# Create group if it doesn't exist
if ! getent group decisionbench >/dev/null 2>&1; then
    groupadd -g "$PGID" decisionbench
fi

# Create user if it doesn't exist
if ! getent passwd decisionbench >/dev/null 2>&1; then
    useradd -u "$PUID" -g "$PGID" -d /app -s /bin/sh -M decisionbench
fi

# Ensure data directory exists and update ownership
mkdir -p /app/data
chown -R "$PUID:$PGID" /app/data

echo "Permissions configured successfully. Dropping privileges to decisionbench user..."

# Execute FastAPI via gosu
exec gosu "$PUID:$PGID" uvicorn app.main:app --host 0.0.0.0 --port 8000
