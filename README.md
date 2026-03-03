# MR-Fit

AI-powered personal fitness platform that delivers adaptive workout plans, real-time coaching, and wearable data integration — all in one unified application.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Database | Supabase — PostgreSQL 15, Auth, Realtime, pgvector |
| Automation | n8n (self-hosted workflow engine) |
| AI | OpenAI GPT-4o, RAG pipeline with pgvector embeddings |

## Repository Structure

```
mrfit/
├── frontend/          # Next.js 14 App Router application
├── backend/           # n8n workflow JSON exports and documentation
├── ai/                # RAG pipeline, embedding scripts, vector DB setup
├── database/          # Supabase schema SQL, seed data, migrations
├── docs/              # API contract, architecture diagrams
└── .github/workflows/ # CI/CD GitHub Actions
```

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for n8n and local Supabase)
- Python 3.11+ (for AI scripts)

### 1. Clone and install

```bash
git clone https://github.com/zyadelfeki/MR-Fit.git
cd MR-Fit
cp .env.example .env.local
```

### 2. Configure environment variables

Fill in `.env.local` with your credentials (see `.env.example` for required keys).

### 3. Set up the database

Apply the schema to your Supabase project:

```bash
psql "$SUPABASE_DB_URL" -f database/schema.sql
```

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

### 5. Run AI scripts

```bash
cd ai
pip install -r requirements.txt
python embed.py
```

## Environment Variables

See [`.env.example`](.env.example) for all required environment variables and their descriptions.

## Database Schema

Core tables: `users`, `profiles`, `workouts`, `exercises`, `workout_logs`, `wearable_data`.

Full schema: [`database/schema.sql`](database/schema.sql)

## API

See [`docs/api-contract.md`](docs/api-contract.md) for the full REST and Realtime API contract.

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for system architecture diagrams and data-flow documentation.

## License

MIT
# MR-Fit
