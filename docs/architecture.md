# MR-Fit – Architecture

## System overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client (Browser)                           │
│                    Next.js 14 App Router (SSR/RSC)                  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS
              ┌─────────────────▼──────────────────┐
              │         Vercel Edge Network          │
              │   Next.js API routes (Route Handlers)│
              └──────┬──────────────────────┬────────┘
                     │                      │
           ┌─────────▼──────┐    ┌──────────▼──────────┐
           │   Supabase      │    │   n8n (self-hosted)  │
           │  ─────────────  │    │  ─────────────────   │
           │  PostgreSQL 15  │    │  Workflow engine     │
           │  Auth (JWT)     │    │  Webhooks & Cron     │
           │  Realtime WS    │    │  HTTP nodes          │
           │  pgvector       │    └──────────┬───────────┘
           │  Storage        │               │
           └────────┬────────┘               │
                    │                        │ OpenAI API (GPT-4o)
                    │              ┌──────────▼───────────┐
                    │              │     OpenAI Platform   │
                    │              │   GPT-4o (chat)       │
                    │              │   text-embedding-3-   │
                    │              │   small  (vectors)    │
                    │              └──────────────────────┘
                    │
           ┌────────▼────────┐
           │  Wearable APIs   │
           │  Garmin Connect  │
           │  Fitbit API      │
           │  Apple Health    │
           └─────────────────┘
```

---

## Component responsibilities

### Frontend – Next.js 14 App Router

- Server Components (RSC) fetch data directly from Supabase using the service-role key on the server.
- Client Components handle interactivity (workout logging, real-time updates via Supabase Realtime).
- Route Handlers (`/app/api/**`) act as a thin BFF (backend-for-frontend), validating requests and proxying to n8n or Supabase.
- Tailwind CSS provides utility-first styling.

### Database – Supabase

| Feature | Usage |
|---|---|
| PostgreSQL 15 | Primary relational store for all application data |
| Row-Level Security | Enforces per-user data isolation at the DB layer |
| Auth | JWT-based authentication; email/password + OAuth providers |
| Realtime | WebSocket channels so the UI updates live when rows change |
| pgvector | Stores 1536-dim exercise embeddings for semantic search |
| Storage | Stores user avatar images and any uploaded workout media |

### Backend automation – n8n

- **workout-plan-generator**: Receives a webhook from the Next.js API, fetches the user profile from Supabase, performs a vector similarity search over exercises to select candidates, calls GPT-4o to generate a structured plan, and writes the result to `workouts` + triggers a Realtime notification.
- **wearable-sync**: Runs on a cron schedule, polls wearable provider OAuth APIs, normalises metrics, and upserts into `wearable_data`.
- **progress-report**: On-demand webhook; aggregates 30-day log data and asks GPT-4o to produce a natural-language progress narrative.

### AI – RAG Pipeline

1. **Offline embedding** (`ai/embed.py`): Iterates over the `exercises` table and calls `text-embedding-3-small` to produce 1536-dim vectors stored in the `embedding` column.
2. **Online retrieval** (inside n8n): When generating a workout plan, the n8n HTTP node calls a Supabase RPC that runs `ORDER BY embedding <=> query_vector LIMIT 20` to retrieve the most relevant exercises.
3. **Generation**: The retrieved exercise list is injected into a GPT-4o system prompt alongside the user's profile, current fitness level, and goal.

---

## Data flow: AI workout generation

```
User clicks "Generate Plan"
        │
        ▼
Next.js Route Handler POST /api/workouts/generate
        │  forwards to
        ▼
n8n webhook trigger
        │
        ├─ Supabase: SELECT profile, recent workout_logs
        │
        ├─ Supabase RPC: vector similarity search on exercises
        │
        ├─ OpenAI GPT-4o: structured plan generation (JSON mode)
        │
        └─ Supabase: INSERT workout + workout_exercises
                │
                ▼
        Supabase Realtime → client notified → UI updates
```

---

## Security model

- All tables have Row-Level Security policies; no data leaks between users even with anon key.
- The `SUPABASE_SERVICE_ROLE_KEY` is never exposed to the browser; it is used only in Next.js Server Components / Route Handlers and in n8n.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is used in the browser only for auth session management; RLS prevents unauthorised data access.
- n8n instance is deployed behind a reverse proxy with HTTPS and basic authentication enabled.
