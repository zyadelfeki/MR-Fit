import os
import psycopg2
import psycopg2.extras
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sentence_transformers import SentenceTransformer
import httpx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.environ.get("DATABASE_URL")
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3:8b")

if not DATABASE_URL:
    raise RuntimeError("Missing DATABASE_URL in environment")

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)

SYSTEM_PROMPT = """You are MR-Fit AI Coach — a personal trainer and nutritionist.
Always complete your full response. Never cut off mid-sentence.
Be concise: keep replies under 200 words unless the user asks for detail.
Be encouraging and reference the user's actual data when available."""

class ChatMessage(BaseModel):
    role: str
    content: str

class RecommendRequest(BaseModel):
    user_id: str
    message: Optional[str] = None
    messages: Optional[List[ChatMessage]] = None

@app.get("/health")
def health_check():
    return {"status": "ok", "ollama": OLLAMA_URL, "model": OLLAMA_MODEL}

@app.post("/recommend")
async def recommend(req: RecommendRequest):
    user_message_text = req.message
    if not user_message_text and req.messages:
        for m in reversed(req.messages):
            if m.role == "user":
                user_message_text = m.content
                break

    if not user_message_text:
        raise HTTPException(status_code=400, detail="No message provided")

    # --- DB context (all optional — failures degrade gracefully) ---
    profile = {}
    recent_workouts_str = "No recent workouts found."
    matched_exercises = []

    db = None
    try:
        db = get_db()
        cur = db.cursor()

        # 1. User profile
        try:
            cur.execute(
                "SELECT display_name, fitness_goal, fitness_level, weight_kg FROM profiles WHERE user_id = %s::uuid",
                (req.user_id,)
            )
            row = cur.fetchone()
            profile = dict(row) if row else {}
        except Exception as e:
            print(f"[coach] profile fetch skipped: {e}")
            db.rollback()

        # 2. Recent workout logs
        try:
            cur.execute("""
                SELECT wl.sets_completed, wl.reps_completed, wl.weight_kg, wl.logged_at, e.name as exercise_name
                FROM workout_logs wl
                LEFT JOIN exercises e ON wl.exercise_id = e.id
                WHERE wl.user_id = %s::uuid
                ORDER BY wl.logged_at DESC
                LIMIT 5
            """, (req.user_id,))
            logs = cur.fetchall()
            if logs:
                recent_workouts_str = "Recent Workouts:\n" + "\n".join([
                    f"- {log['exercise_name'] or 'Unknown'}: "
                    f"{log['sets_completed']}x{log['reps_completed']} "
                    f"@ {log['weight_kg'] or 'bodyweight'}kg"
                    for log in logs
                ])
        except Exception as e:
            print(f"[coach] workout logs fetch skipped: {e}")
            db.rollback()

        # 3. pgvector similarity search (requires pgvector extension)
        try:
            query_embedding = embedding_model.encode(user_message_text).tolist()
            embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
            cur.execute("""
                SELECT id, name, description, muscle_group, difficulty,
                       embedding <=> %s::vector AS distance
                FROM exercises
                WHERE embedding IS NOT NULL
                ORDER BY embedding <=> %s::vector
                LIMIT 5
            """, (embedding_str, embedding_str))
            matched_exercises = [dict(row) for row in cur.fetchall()]
            for ex in matched_exercises:
                ex.pop("distance", None)
        except Exception as e:
            print(f"[coach] pgvector search skipped: {e}")
            db.rollback()

    except Exception as e:
        print(f"[coach] DB connection failed: {e}")
    finally:
        if db:
            db.close()

    # --- Build context string ---
    exercises_text = "\n".join([
        f"- {ex['name']} ({ex['muscle_group']}, {ex['difficulty']}): {ex.get('description', '')}"
        for ex in matched_exercises
    ]) or "No matched exercises available."

    context_str = f"""User Profile:
Name: {profile.get('display_name', 'User')}
Goal: {profile.get('fitness_goal', 'Not specified')}
Level: {profile.get('fitness_level', 'Not specified')}
Current Weight: {profile.get('weight_kg', 'Unknown')}kg

{recent_workouts_str}

Relevant Exercises from database:
{exercises_text}"""

    # --- Build Ollama messages ---
    ollama_messages = [
        {"role": "system", "content": SYSTEM_PROMPT + "\n\n" + context_str}
    ]

    if req.messages:
        for m in req.messages:
            role = "assistant" if m.role in ("ai", "assistant") else "user"
            if role == "assistant" and "MR-Fit AI Coach" in m.content:
                continue
            ollama_messages.append({"role": role, "content": m.content})
    else:
        ollama_messages.append({"role": "user", "content": user_message_text})

    # --- Call Ollama ---
    reply_text = "I'm having trouble reaching the AI right now. Please try again."
    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            res = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json={
                    "model": OLLAMA_MODEL,
                    "messages": ollama_messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": -1
                    }
                }
            )
            res.raise_for_status()
            data = res.json()
            reply_text = data["message"]["content"]
    except Exception as e:
        print(f"[coach] Ollama error: {e}")

    return {"reply": reply_text, "exercises": matched_exercises}
