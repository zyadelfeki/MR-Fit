import os
import psycopg2
import psycopg2.extras
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sentence_transformers import SentenceTransformer
import httpx
from dotenv import load_dotenv
import json
import logging

load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mrfit.ai.coach")

from wearables import router as wearables_router
import gemini_service

app = FastAPI()
app.include_router(wearables_router)

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

class ParseEntryRequest(BaseModel):
    text: str
    prefill_exercise: Optional[str] = None

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "ollama": OLLAMA_URL,
        "model": OLLAMA_MODEL,
        "gemini_available": gemini_service.is_gemini_available()
    }

def _build_wearable_context(user_id: str, db) -> str:
    """Reads latest wearable snapshots and formats them for the LLM prompt."""
    try:
        cur = db.cursor()
        cur.execute("""
            SELECT DISTINCT ON (data_type)
                data_type, payload, recorded_at
            FROM wearable_snapshots
            WHERE user_id = %s::uuid
            ORDER BY data_type, recorded_at DESC
        """, (user_id,))
        rows = cur.fetchall()
        if not rows:
            return ""

        lines = ["\nWearable Data (from connected device):"]
        for row in rows:
            dtype = row["data_type"]
            payload = row["payload"] if isinstance(row["payload"], dict) else json.loads(row["payload"])

            if dtype == "daily":
                lines.append(f"  Steps today: {payload.get('steps', 'N/A')}")
                lines.append(f"  Calories burned: {payload.get('calories_burned', 'N/A')} kcal")
                lines.append(f"  Active minutes: {payload.get('active_minutes', 'N/A')} min")
                lines.append(f"  Distance: {payload.get('distance_km', 'N/A')} km")

            elif dtype == "sleep":
                lines.append(f"  Sleep duration: {payload.get('duration_hours', 'N/A')} hrs")
                lines.append(f"  Sleep score: {payload.get('sleep_score', 'N/A')}")
                lines.append(f"  Deep sleep: {payload.get('deep_sleep_hours', 'N/A')} hrs")
                lines.append(f"  REM sleep: {payload.get('rem_sleep_hours', 'N/A')} hrs")

            elif dtype == "body":
                lines.append(f"  Heart rate (resting): {payload.get('resting_hr', 'N/A')} bpm")
                lines.append(f"  HRV: {payload.get('hrv', 'N/A')} ms")
                lines.append(f"  SpO2: {payload.get('spo2', 'N/A')}%")
                lines.append(f"  Skin temp: {payload.get('skin_temp_celsius', 'N/A')} °C")

            elif dtype == "activity":
                lines.append(f"  Last activity: {payload.get('activity_type', 'N/A')}")
                lines.append(f"  Duration: {payload.get('duration_minutes', 'N/A')} min")
                lines.append(f"  Avg HR during activity: {payload.get('avg_hr', 'N/A')} bpm")
                lines.append(f"  Calories: {payload.get('calories', 'N/A')} kcal")

        return "\n".join(lines)
    except Exception as e:
        logger.error(f"wearable context error: {e}")
        db.rollback()
        return ""

async def parse_entry_ollama_fallback(text: str, prefill_exercise: Optional[str] = None) -> List[Dict[str, Any]]:
    """Ollama-based parsing fallback when Gemini is unavailable."""
    prompt = f"""You are a structured parser for fitness and nutrition logs.
User input: "{text}"
Prefilled Exercise: "{prefill_exercise or 'None'}"

Task: Extract all fitness or nutrition items from the input.
Return ONLY a valid JSON list of objects:
[
  {{"type": "EXERCISE" | "NUTRITION", "name": "exercise or food name", "calories": calories_estimated_if_food_or_null, "sets": 1, "reps": reps_or_null, "weight": weight_kg_or_null}}
]
Rules:
- For multi-set descriptions like "3 sets of 10", return 3 separate objects, one for each set.
- Omit markdown, return only raw JSON.
"""
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            res = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                }
            )
            res.raise_for_status()
            data = res.json()
            raw_text = data.get("response", "").strip()
            data_list = json.loads(raw_text)
            
            if not isinstance(data_list, list):
                data_list = [data_list]
                
            parsed_items = []
            for data in data_list:
                if "type" not in data or data["type"] not in ("EXERCISE", "NUTRITION"):
                    continue
                if data.get("type") == "EXERCISE":
                    s = max(data.get("sets") or 1, 1)
                    r = max(data.get("reps") or 0, 0)
                    w = max(data.get("weight") or 0.0, 0.0)
                    data["volume"] = round(s * r * w, 2)
                else:
                    data["volume"] = None
                parsed_items.append(data)
            return parsed_items
    except Exception as e:
        logger.error(f"Ollama parse fallback failed: {e}")
        raise RuntimeError(f"Ollama parse failed: {e}")

@app.post("/parse-entry")
async def parse_entry(req: ParseEntryRequest):
    """Parses a natural-language fitness entry using Gemini, falling back to Ollama."""
    if gemini_service.is_gemini_available():
        try:
            parsed = gemini_service.parse_magic_input(req.text, req.prefill_exercise)
            return parsed
        except Exception as e:
            logger.error(f"Gemini parsing failed, trying Ollama: {e}")
    
    # Fallback to Ollama
    try:
        parsed = await parse_entry_ollama_fallback(req.text, req.prefill_exercise)
        return parsed
    except Exception as e:
        logger.error(f"All parsing engines failed: {e}")
        raise HTTPException(status_code=502, detail=f"Failed to parse entry: {e}")

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

    profile = {}
    recent_workouts_str = "No recent workouts found."
    matched_exercises = []
    wearable_context = ""

    db = None
    try:
        db = get_db()
        cur = db.cursor()

        try:
            cur.execute(
                "SELECT display_name, fitness_goal, fitness_level, weight_kg FROM profiles WHERE user_id = %s::uuid",
                (req.user_id,)
            )
            row = cur.fetchone()
            profile = dict(row) if row else {}
        except Exception as e:
            logger.error(f"profile fetch skipped: {e}")
            db.rollback()

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
            logger.error(f"workout logs fetch skipped: {e}")
            db.rollback()

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
            logger.error(f"pgvector search skipped: {e}")
            db.rollback()

        # Pull wearable context
        wearable_context = _build_wearable_context(req.user_id, db)

    except Exception as e:
        logger.error(f"DB connection failed: {e}")
    finally:
        if db:
            db.close()

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
{wearable_context}

Relevant Exercises from database:
{exercises_text}"""

    # If Gemini is available, use it!
    if gemini_service.is_gemini_available():
        try:
            logger.info("Generating coach advice using Gemini 2.5 Flash...")
            
            # Map req.messages to the list structure required by gemini_service
            history_list = []
            if req.messages:
                for m in req.messages:
                    if m.role == "system":
                        continue
                    history_list.append({
                        "role": "coach" if m.role in ("ai", "assistant") else "user",
                        "text": m.content
                    })
            
            # Remove the last message from history since it's the current user_message_text
            if history_list and history_list[-1]["role"] == "user":
                history_list.pop()
                
            user_context = {
                "period_days": 14,
                "display_name": profile.get("display_name", "User"),
                "fitness_goal": profile.get("fitness_goal", "Not specified"),
                "fitness_level": profile.get("fitness_level", "Not specified"),
                "weight_kg": float(profile.get("weight_kg", 0)) if profile.get("weight_kg") else 0.0,
                "context_str": context_str
            }
            
            res_gemini = gemini_service.ask_coach_gemini(user_message_text, user_context, history_list)
            return {"reply": res_gemini.get("answer", ""), "exercises": matched_exercises}
        except Exception as e:
            logger.error(f"Gemini recommendation failed, falling back to Ollama: {e}")

    # Ollama Fallback
    logger.info("Generating coach advice using local Ollama fallback...")
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
        logger.error(f"Ollama error: {e}")
        raise HTTPException(status_code=502, detail=f"Ollama recommendation failed: {e}")

    return {"reply": reply_text, "exercises": matched_exercises}

class FoodImageRequest(BaseModel):
    image_base64: str  # Can be raw base64 or a data URI (data:image/jpeg;base64,...)
    mime_type: Optional[str] = "image/jpeg"

async def analyze_food_image_ollama_fallback(image_base64: str, mime_type: str = "image/jpeg") -> Dict[str, Any]:
    """
    Ollama-based vision fallback (e.g. using llava or bakllava).
    """
    # Ollama expects the raw base64 string without data URI prefixes
    raw_base64 = image_base64
    if "," in image_base64:
        raw_base64 = image_base64.split(",")[1]

    OLLAMA_VISION_MODEL = os.getenv("OLLAMA_VISION_MODEL", "llava")

    prompt = """Analyze this food image. Identify the food item and estimate the total calorie count and macronutrients.
    Return ONLY a valid JSON object with the following schema:
    {
      "food_name": "detected food name",
      "estimated_weight_g": 300,
      "total_calories": 450,
      "protein_g": 20.0,
      "carbs_g": 45.0,
      "fat_g": 12.0,
      "confidence": 0.8
    }
    No explanation, no markdown. Just the raw JSON.
    """
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": OLLAMA_VISION_MODEL,
                    "prompt": prompt,
                    "images": [raw_base64],
                    "stream": False,
                    "format": "json"
                }
            )
            res.raise_for_status()
            data = res.json()
            raw_text = data.get("response", "").strip()
            result = json.loads(raw_text)
            return result
    except Exception as e:
        logger.error(f"Ollama vision fallback failed: {e}")
        raise RuntimeError(f"Ollama vision analysis failed: {e}")

@app.post("/analyze-food-image")
async def analyze_food_image(req: FoodImageRequest):
    """
    Analyze a food image to estimate calories and macros.
    First tries Gemini 2.5 Flash (native vision), then falls back to local Ollama (Llava/Bakllava).
    """
    # 1. Try Gemini
    if gemini_service.is_gemini_available():
        try:
            # Decode the base64 string to bytes
            raw_base64 = req.image_base64
            if "," in raw_base64:
                raw_base64 = raw_base64.split(",")[1]
            
            import base64
            image_bytes = base64.b64decode(raw_base64)
            
            result = gemini_service.analyze_food_image_gemini(image_bytes, req.mime_type)
            return result
        except Exception as e:
            logger.error(f"Gemini vision analysis failed, trying Ollama: {e}")
            
    # 2. Try Ollama Fallback
    try:
        result = await analyze_food_image_ollama_fallback(req.image_base64, req.mime_type)
        return result
    except Exception as e:
        logger.error(f"All vision engines failed: {e}")
        raise HTTPException(status_code=502, detail=f"Failed to analyze image: {e}")
