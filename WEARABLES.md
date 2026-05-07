# Wearables Integration

MR-Fit uses [Open Wearables](https://github.com/the-momentum/open-wearables) — a self-hosted, open-source bridge that connects 500+ devices (Apple Watch, Garmin, Oura Ring, Whoop, Samsung Health) through a single webhook.

## How data flows

```
Apple Watch / Garmin / Oura / Whoop
        ↓  (Open Wearables syncs automatically)
Open Wearables  →  POST /wearables/webhook  →  coach.py
                                                   ↓
                                          wearable_snapshots (PostgreSQL)
                                                   ↓
                                     AI context for qwen3:8b
                                                   ↓
                                     Personalized advice in chat
```

## Setup

### 1. Run the migration
```bash
psql -U postgres -d mrfit -f ai/migrate_wearables.sql
```

### 2. Start Open Wearables
```bash
cd open-wearables
docker compose up -d
```

### 3. Add env vars

In `ai/.env`:
```env
OPEN_WEARABLES_SECRET=changeme
```

### 4. Connect your device

Open **http://localhost:4000**, connect your wearable, and set the webhook to:
```
http://host.docker.internal:8000/wearables/webhook
```

### 5. See your data

Go to **http://localhost:3000/dashboard/wearables**

## Supported data types

| Type | Fields |
|---|---|
| `daily` | steps, calories_burned, active_minutes, distance_km |
| `sleep` | duration_hours, sleep_score, deep_sleep_hours, rem_sleep_hours |
| `body` | resting_hr, hrv, spo2, skin_temp_celsius |
| `activity` | activity_type, duration_minutes, avg_hr, calories |
