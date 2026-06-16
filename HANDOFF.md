# MR-Fit Project Handoff Documentation 🏋️

Welcome to the comprehensive handoff documentation for **MR-Fit** — a state-of-the-art, AI-powered personal fitness companion. This document provides a high-level overview, architecture blueprint, feature breakdown, database schema guide, and deployment instructions for developers and stakeholders taking over the codebase.

---

## 📌 Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Core Features & Subsystems](#3-core-features--subsystems)
   - [Frontend Web Application (Next.js 14)](#frontend-web-application-nextjs-14)
   - [Nutrition Logger & AI Vision Food Scanner](#nutrition-logger--ai-vision-food-scanner)
   - [AI Coach Subsystem](#ai-coach-subsystem)
   - [Smart Exercise Tracker](#smart-exercise-tracker)
   - [Wearables Integration](#wearables-integration)
4. [Database & Data Architecture](#4-database--data-architecture)
5. [Setup & Configuration Guide](#5-setup--configuration-guide)
6. [Git Repository & Push Guide](#6-git-repository--push-guide)

---

## 1. Executive Summary

**MR-Fit** is designed to bridge the gap between traditional fitness tracking apps and personal coaching. By combining a modern web frontend with AI services and wearable IoT integrations, the platform enables users to log workouts, get intelligent macro-balanced dietary analysis, count repetitions automatically using IMU sensor data, and chat with an AI coach that possesses context of their real-world sleep, steps, and activity.

### 🛠 Technology Stack
* **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, NextAuth.js (Session Auth).
* **Database**: PostgreSQL (relational storage) with advanced pooling, transactions, and retry logic.
* **AI Coach & NLP Service**: Python (FastAPI) + Google Gemini Pro (Gemini 2.5 Flash) + Ollama (Local LLM fallback using `qwen3:8b`/`llama3`) + SentenceTransformers (RAG/embeddings).
* **Smart Tracker Microservice**: FastAPI + scikit-learn (Random Forest classification & signal peak-detection for rep-counting).
* **IoT/Wearables Bridge**: Open Wearables (Dockerized sync engine supporting 500+ consumer devices).

---

## 2. System Architecture

MR-Fit uses a decoupled, microservice-based architecture to separate presentation, data management, and compute-intensive AI operations.

```mermaid
graph TD
    User([User Device / Browser]) -->|HTTPS| FE[Next.js Frontend - Port 3000]
    User -->|IMU Sensors| ST[Smart Tracker FastAPI - Port 8001]
    
    subgraph Web App Context
        FE -->|Direct DB Queries / Transaction| DB[(PostgreSQL Database)]
        FE -->|Route Proxy| AI[AI Coach FastAPI - Port 8000]
    end

    subgraph AI Subsystem
        AI -->|Generate Advice / Chat / Parse| Gemini[Google Gemini 2.5 Flash]
        AI -->|Local Fallback| Ollama[Local Ollama instance]
        AI -->|Vector Search| SentTrans[Sentence Transformers]
    end

    subgraph IoT & Wearables
        Wearable([Apple Watch / Garmin / Oura / Whoop]) -->|Sync| OW[Open Wearables Engine - Port 4000]
        OW -->|Webhook Payload| AI
        AI -->|Persist Snapshot| DB
    end
```

---

## 3. Core Features & Subsystems

### Frontend Web Application (Next.js 14)
* **Premium UX/UI**: Clean dark-themed styling without intrusive emojis, focusing on clean typography, glassmorphism card designs, and vibrant accents.
* **Onboarding & User Settings**: Seamless onboarding flow that captures body metrics, experience levels, fitness goals (bulk, cut, maintain), and automatically calculates recommended daily target macronutrients.
* **Workout Management**:
  - Log active workouts with detailed tracking for exercises, sets, reps, weights, and comments.
  - Custom Workout Templates to quickly start recurring routines.
  - Searchable library of over 800+ categorized exercises.
* **Database Connection Stability**: Consolidates all page queries inside an optimized connection pool proxy (`withDb()`) to handle concurrent requests without pool exhaustion timeouts.

### Nutrition Logger & AI Vision Food Scanner
* **Multi-Modal Logging**: Users can log meals manually (with live database search) or use the **AI Vision Scanner**.
* **Real-time Camera & File Upload**: Integrated camera capture (webcam) and file uploader options right on the nutrition dashboard.
* **Vision Estimator**: 
  - Submits meal images (as Base64 encoded blobs) to the `/api/nutrition/scan` endpoint.
  - Proxies requests to the Python AI service.
  - Uses the **Gemini 2.5 Flash Vision API** to identify food types, estimate portions in grams, and calculate total calories, protein, carbs, and fat.
  - Provides a local computer vision model fallback if Gemini is unconfigured.
  - Allows single-click acceptance, auto-populating the nutrition entry form.

### AI Coach Subsystem
* **Personalized Analysis**: Synthesizes the user's recent 14-day history (completed workouts, progressive overload metrics, target vs. consumed calories, and sleep/wearable data).
* **RAG-enhanced Advice**: Employs SentenceTransformers embeddings to look up relevant fitness patterns.
* **Context-Aware Conversational Chat**: Users can chat directly with the coach. The coach parses requests, understands historical fatigue, and suggests custom 4-6 exercise routines tailored to lagging muscle groups.
* **Fallback Strategy**: Transparently queries Google Gemini if an API key is provided, falling back to a local Ollama LLM (`qwen3:8b`/`llama3`) when running offline.

### Smart Exercise Tracker
* **IMU Sensor Integration**: Consumes raw accelerometer and gyroscope data streams.
* **AI Classification**: Processes sensor readings through a trained Random Forest classifier to identify the active exercise type.
* **Repetition Counter**: Uses signal-processing peak detection algorithms to calculate repetitions and sets in real-time.

### Wearables Integration
* **Universal Bridge**: Supported by an Open Wearables container listening to incoming synchronization events.
* **Four Data Categories**:
  - `daily`: steps, active minutes, distance, calories burned.
  - `sleep`: duration, sleep score, sleep stages.
  - `body`: resting heart rate, HRV, SpO2, skin temperature.
  - `activity`: session logs, average heart rate, active duration.

---

## 4. Database & Data Architecture

MR-Fit stores relational data in PostgreSQL. Below is an overview of the key database structures:

| Table Name | Primary Purpose |
|---|---|
| `users` | User credentials, email, hashed passwords. |
| `profiles` | Bodyweight, targets, goals, experience levels, and calculated daily macro limits. |
| `workout_templates` | Predefined collections of exercises saved by the user. |
| `workout_logs` | Sessions recorded, timestamps, duration, and comments. |
| `exercises` | Global directory of 800+ exercises with primary muscles. |
| `workout_sets` | Single log entries tracking reps, sets, weight, and calculated volume. |
| `nutrition_logs` | Daily logged meals, timestamps, calories, and macros. |
| `wearable_snapshots` | Latest synchronized data snapshots from connected wearable devices. |

### PostgreSQL Pooling Configuration (`frontend/lib/db.ts`)
To prevent connection leaks and database timeouts:
* Uses a unified connection pool proxy `withDb(callback)` that acquires a client, executes queries, and guarantees release via a `finally` block.
* Configured with explicit parameters:
  ```typescript
  min: 0,
  max: 10,
  idleTimeoutMillis: 10000,
  keepAlive: true
  ```
* Reconnects and retries on dropped sockets.

---

## 5. Setup & Configuration Guide

### 1. Database Setup
Create a PostgreSQL database and apply the schemas:
```bash
# Create database
createdb mrfit

# Import schema and seed data
psql -d mrfit -f database/schema.sql
psql -d mrfit -f database/demo_seed.sql
```

### 2. Next.js Frontend Configuration
Navigate to the `frontend/` folder, copy `.env.local.example` to `.env.local`, and populate the parameters:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/mrfit"
NEXTAUTH_SECRET="your-32-character-secret"
NEXTAUTH_URL="http://localhost:3000"
GEMINI_API_KEY="AIzaSy..." # Optional, enables high-quality Gemini analysis
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="qwen3:8b"
```
Install dependencies and run the server:
```bash
cd frontend
npm install
npm run dev
```

### 3. AI Service (Python FastAPI) Setup
Ensure you have Python 3.10+ installed. Install the requirements and set up the environmental variables in `ai/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/mrfit"
GEMINI_API_KEY="AIzaSy..."
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="qwen3:8b"
OPEN_WEARABLES_SECRET="your_webhook_secret"
```
Install requirements and start the service on Port 8000:
```bash
cd ai
pip install -r requirements.txt
uvicorn coach:app --port 8000 --reload
```

### 4. Smart Exercise Tracker Setup
Navigate to the `smart-tracker/` folder, install requirements, and run the FastAPI server on Port 8001:
```bash
cd smart-tracker
pip install -r api/requirements.txt # or install main packages (fastapi, uvicorn, scikit-learn, numpy)
uvicorn api.main:app --port 8001 --reload
```

---

## 6. Git Repository & Push Guide

The project is tracked across multiple Git remote repositories.

### Configured Remotes
To inspect current remotes, run:
```bash
git remote -v
```
You will find:
* `origin`: Points to GitHub (`https://github.com/zyadelfeki/MR-Fit`)
* `gitlab`: Points to the GitLab Group (`https://gitlab.com/zyadelfeki-group/MR-Fit.git`)
* `gitlab2`: Points to the personal GitLab URL (`https://zyadelfeki11@gitlab.com/zyadelfeki11/MR-Fit.git`)

### Pushing Updates to GitLab (`gitlab2`)
If pushing to your personal repository (`gitlab2`) fails with a `repository not found` error, it is due to credential caching. By setting the remote URL with your username (as done in `https://zyadelfeki11@gitlab.com/zyadelfeki11/MR-Fit.git`), Git forces the credential manager to request the correct login credentials for the `zyadelfeki11` account.

To push all changes to your personal GitLab repository:
```bash
git push gitlab2 main
```
If prompted, enter your GitLab credentials or personal access token (PAT) for the `zyadelfeki11` account.

---

*Handoff documentation prepared by the Antigravity pair-programming agent, June 2026.*
