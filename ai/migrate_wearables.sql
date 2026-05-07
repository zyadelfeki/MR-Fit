-- Run this once against your mrfit PostgreSQL database
-- psql -U postgres -d mrfit -f migrate_wearables.sql

CREATE TABLE IF NOT EXISTS wearable_snapshots (
    id            BIGSERIAL PRIMARY KEY,
    user_id       UUID NOT NULL,
    data_type     TEXT NOT NULL,          -- 'daily' | 'sleep' | 'body' | 'activity'
    payload       JSONB NOT NULL,
    recorded_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, data_type, recorded_at)
);

CREATE INDEX IF NOT EXISTS idx_wearable_snapshots_user
    ON wearable_snapshots (user_id, data_type, recorded_at DESC);
