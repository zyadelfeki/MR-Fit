# MR-Fit — AI-Powered Fitness Companion

MR-Fit is a comprehensive fitness tracking application featuring an AI coach, personalized recommendations, and wearable data integration. The platform allows users to log workouts, track nutrition, and interact with an AI trainer that provides tailored insights based on their personal fitness profiles and history.

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Supabase SSR |
| Backend | FastAPI, Python, sentence-transformers, pgvector |
| Database | PostgreSQL via Supabase, pgvector extension |
| AI | OpenAI gpt-4o-mini, RAG pipeline with vector search |

## Architecture Overview

```text
User → Next.js Frontend → Supabase (Auth + DB)
                       ↓
                  FastAPI AI Service → OpenAI API
                       ↓
                  pgvector similarity search
```

## Getting Started

**Prerequisites:** Node.js 18+, Python 3.10+, Supabase account, OpenAI API key

1. Clone the repo
2. `cd frontend && npm install`
3. Copy `frontend/.env.local.example` to `frontend/.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Run `schema.sql` and `seed.sql` in Supabase SQL editor
5. Run `functions.sql` in Supabase SQL editor
6. `cd ai && pip install -r requirements.txt`
7. Copy `ai/.env.example` to `ai/.env` and fill in your keys
8. `python embed.py` (generates exercise embeddings)
9. `uvicorn coach:app --reload` (start AI server)
10. `npm run dev` (start frontend)

## Features

- 🔐 Secure authentication flow via Supabase
- 📊 Personalized user profiles with fitness goals and levels
- 🏋️‍♂️ Comprehensive workout logging with sets, reps, and weights tracker
- 🥗 Daily nutrition tracking with macros and calorie counting
- 🤖 AI Coach powered by OpenAI and RAG for tailored advice
- 🔍 Semantic similarity search for exercises using pgvector
- 📱 Fully responsive, modern UI built with Tailwind CSS

## Database Schema

- `profiles` — Stores user metadata like display name, fitness goal, and fitness level.
- `exercises` — Core dictionary of exercises including descriptions and embeddings.
- `workouts` — Contains top-level workout session details.
- `workout_logs` — Links users, specific workouts, and sets/reps for each logged exercise.
- `workout_exercises` — Defines target routines and sets/reps templates.
- `nutrition_logs` — Daily food logs for calorie and macronutrient tracking.
- `api_keys` — Secure storage for external API credentials (if applicable).
