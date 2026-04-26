# MR-Fit 🏋️

> Your AI-powered fitness companion — track workouts, log nutrition, and get personalized coaching from a local LLM.

## ✨ Features

- 🏋️ **Workout Logging** — Create and log workouts with sets, reps, weights, and notes
- 🧠 **AI Coach** — Chat with a local LLM (Ollama) for personalized fitness advice
- 🤖 **Smart Exercise Tracker** — AI-powered exercise classification + automatic rep counting via IMU sensor data
- 🥗 **Nutrition Tracking** — Log meals, search a food database, and track daily macros against your goals
- 📊 **Progress Charts** — Weight trend chart, workout frequency heatmap, and personal records table
- 💪 **Exercise Library** — Browse and filter 800+ exercises by muscle group with live search
- 👤 **User Profiles** — Set fitness goals, level, body stats, and macro targets
- 🌙 **Dark Mode** — Full dark/light theme toggle with system preference detection

## 🛠 Tech Stack

| Frontend | Backend / AI |
|---|---|
| Next.js 14 (App Router) | Node.js + PostgreSQL |
| TypeScript | NextAuth.js (session auth) |
| Tailwind CSS | Ollama (local LLM — AI Coach) |
| React 18 | FastAPI + scikit-learn (Smart Tracker) |

## 🗂 Project Structure

```
MR-Fit/
├── frontend/          # Next.js 14 app
│   ├── app/           # App Router pages & layouts
│   ├── components/    # Shared UI components
│   └── lib/           # DB client, auth helpers, utilities
├── smart-tracker/     # FastAPI AI microservice
│   ├── api/           # /predict + /count-reps endpoints
│   └── model/         # Trained Random Forest model
├── database/
│   ├── schema.sql     # Full DB schema
│   └── demo_seed.sql  # Demo data (17 workouts, 30 nutrition entries)
└── docker-compose.yml
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- [Ollama](https://ollama.ai) (for AI Coach — optional)
- Python 3.10+ (for Smart Tracker — optional)

### Installation

1. Clone the repo
   ```bash
   git clone https://github.com/zyadelfeki/MR-Fit.git && cd MR-Fit
   ```
2. Copy and fill environment variables
   ```bash
   cp frontend/.env.local.example frontend/.env.local
   ```
3. Run DB migrations
   ```bash
   psql $DATABASE_URL -f database/schema.sql
   ```
4. Install dependencies and start
   ```bash
   cd frontend && npm install && npm run dev
   ```
5. *(Optional)* Start AI Coach
   ```bash
   ollama serve && ollama pull llama3
   ```
6. *(Optional)* Start Smart Tracker
   ```bash
   cd smart-tracker && pip install -r requirements.txt && uvicorn api.main:app --port 8001
   ```

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost/mrfit` |
| `NEXTAUTH_SECRET` | Random secret for session signing | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | App base URL | `http://localhost:3000` |
| `OLLAMA_URL` | Ollama API base | `http://localhost:11434` |
| `OLLAMA_MODEL` | Model name to use | `llama3` |

### Demo Data

```bash
psql $DATABASE_URL -f database/demo_seed.sql
```
Loads a demo user with 17 workouts, 30 nutrition entries, and 15 weight logs.

## 📸 Screenshots

*Coming soon — see live demo.*

## 👥 Team

Built as a graduation project by Team MR-Fit, Faculty of Computers and Information, 2026.

## 📄 License

MIT
