# Backend – n8n Workflows

This directory contains exported n8n workflow definitions (JSON) and supporting documentation. Each `.json` file is a self-contained workflow that can be imported directly into a self-hosted n8n instance.

## Workflow catalogue

| File | Trigger | Purpose |
|---|---|---|
| `workout-plan-generator.json` | Webhook `POST /generate-plan` | Calls GPT-4o with user profile context to produce a personalised weekly workout plan and writes it to Supabase. |
| `wearable-sync.json` | Cron every 30 min | Polls connected wearable provider APIs (Apple Health Export, Garmin Connect, Fitbit API) and upserts rows into `wearable_data`. |
| `progress-report.json` | Webhook `POST /progress-report` | Aggregates `workout_logs` and `wearable_data` for a date range, calls GPT-4o to generate a narrative progress summary, and returns it as JSON. |

## Importing a workflow into n8n

1. Open your n8n instance and go to **Workflows → Import from file**.
2. Select the `.json` file from this directory.
3. Configure the credential placeholders (Supabase, OpenAI, Wearable provider) inside the workflow using the n8n **Credentials** panel.
4. Activate the workflow.

## Environment variables consumed by n8n

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key for server-side writes |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o calls |
| `GARMIN_CLIENT_ID` | Garmin OAuth2 client ID |
| `GARMIN_CLIENT_SECRET` | Garmin OAuth2 client secret |
| `FITBIT_CLIENT_ID` | Fitbit OAuth2 client ID |
| `FITBIT_CLIENT_SECRET` | Fitbit OAuth2 client secret |

## Webhook base URL

All webhook triggers are prefixed with `N8N_WEBHOOK_BASE_URL` (defined in `.env.example`).  
Example: `https://n8n.yourdomain.com/webhook/generate-plan`
