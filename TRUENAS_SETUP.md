# TrueNAS SCALE Custom App Deployment Guide

**DecisionBench on TrueNAS SCALE (Electric Eel / Dragonfish / Cobia)**

This guide details how to deploy DecisionBench on TrueNAS SCALE as a Custom App with persistent host-path storage and proper Linux user/group ownership to prevent permission lockouts.

---

## 1. TrueNAS Dataset & Permissions Setup

Before launching the container, create a dedicated ZFS dataset for DecisionBench data:

1. In TrueNAS SCALE, navigate to **Datasets**.
2. Select your pool (e.g., `tank` or `data`) and click **Add Dataset**:
   - **Name**: `decisionbench` (e.g. `/mnt/tank/apps/decisionbench`)
   - **Dataset Preset**: `Generic`
3. Click **Save**.
4. Configure Dataset Permissions:
   - Click the three dots next to the new dataset and select **Edit Permissions**.
   - **User**: `1000` (or `apps` / your default app user)
   - **Group**: `1000` (or `apps`)
   - **Apply User**: Check box
   - **Apply Group**: Check box
   - **Access Rights**: Read, Write, Execute for User and Group
   - Click **Save**.

---

## 2. Docker Compose Deployment (Custom App)

In TrueNAS SCALE 24.10+ (Electric Eel) or via the **Custom App / Launch Docker Image** interface, use the following Docker Compose configuration:

```yaml
version: "3.8"

services:
  decisionbench:
    image: ghcr.io/yourusername/decisionbench:latest
    # Or build locally:
    # build: .
    container_name: decisionbench
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      # Linux user and group IDs matching your TrueNAS dataset permissions
      - PUID=1000
      - PGID=1000
      - TZ=America/Chicago
      # Optional: Pre-populate your OpenRouter API Key (or configure in web UI)
      # - OPENROUTER_API_KEY=sk-or-v1-...
      # Optional: Custom encryption secret key (auto-generated if omitted)
      # - DECISIONBENCH_SECRET_KEY=your-32-byte-base64-key=
    volumes:
      # TrueNAS Host Path Dataset mounted to container data directory
      - /mnt/tank/apps/decisionbench:/app/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
```

---

## 3. Environment Variables Reference

| Variable | Default | Purpose |
|---|---|---|
| `PUID` | `1000` | User ID for container process file permissions. |
| `PGID` | `1000` | Group ID for container process file permissions. |
| `DATA_DIR` | `/app/data` | Path to persistent storage inside container. |
| `OPENROUTER_API_KEY` | *(empty)* | Optional default OpenRouter API key. If unset, manage via UI settings. |
| `DECISIONBENCH_SECRET_KEY` | *(empty)* | Optional 32-byte base64 Fernet key. Auto-created at `/app/data/.secret_key` if omitted. |
| `TZ` | `UTC` | Server timezone for run timestamps. |

---

## 4. Backups and Maintenance

- **Zero-Dependency Backup**:
  Because DecisionBench uses SQLite in Write-Ahead Logging (`WAL`) mode, the entire state (encrypted API key, saved scenarios, and historical decision ledger) is contained in `/mnt/tank/apps/decisionbench`.
- Taking a ZFS snapshot of the dataset produces a consistent, transaction-safe backup.
- Restoring from backup is as simple as restoring the snapshot or copying the dataset folder.
