import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from supabase import create_client, Client
from sentence_transformers import SentenceTransformer
import httpx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Enable CORS for localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("Missing Supabase credentials")

if not OPENAI_API_KEY:
    print("WARNING: OPENAI_API_KEY is missing. AI recommendations will return a fallback message.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
model = SentenceTransformer("all-MiniLM-L6-v2")

class ChatMessage(BaseModel):
    role: str
    content: str

class RecommendRequest(BaseModel):
    user_id: str
    message: Optional[str] = None
    messages: Optional[List[ChatMessage]] = None

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/recommend")
async def recommend(req: RecommendRequest):
    try:
        user_message_text = req.message
        if not user_message_text and req.messages:
            for m in reversed(req.messages):
                if m.role == "user":
                    user_message_text = m.content
                    break
                    
        if not user_message_text:
            raise HTTPException(status_code=400, detail="No message provided")

        # 1. Fetch user profile
        try:
            profile_res = supabase.table("profiles").select("display_name, fitness_goal, fitness_level").eq("user_id", req.user_id).single().execute()
            profile = profile_res.data if profile_res.data else {}
        except Exception:
            profile = {}
        
        # 2. Fetch last 5 workout logs joined with exercise name
        logs_res = supabase.table("workout_logs").select(
            "sets_completed, reps_completed, weight_kg, logged_at, exercises(name)"
        ).eq("user_id", req.user_id).order("logged_at", desc=True).limit(5).execute()
        
        logs_data = logs_res.data or []
        
        if logs_data:
            recent_workouts_str = "Recent Workouts:\n" + "\n".join([
                f"- {log.get('exercises', {}).get('name', 'Unknown')}: "
                f"{log.get('sets_completed')}x{log.get('reps_completed')} "
                f"@ {log.get('weight_kg', 'bodyweight')}kg"
                for log in logs_data
            ])
        else:
            recent_workouts_str = "No recent workouts found."

        # 3. Embed message
        query_embedding = model.encode(user_message_text).tolist()

        # 4. Perform vector similarity search
        rpc_res = supabase.rpc("match_exercises", {
            "query_embedding": query_embedding,
            "match_count": 5
        }).execute()
        
        matched_exercises = rpc_res.data or []

        # 5. Build Context String
        context_str = f"""
        User Profile:
        Name: {profile.get('display_name', 'User')}
        Goal: {profile.get('fitness_goal', 'Not specified')}
        Level: {profile.get('fitness_level', 'Not specified')}
        
        {recent_workouts_str}

        Recommended Exercises based on message:
        {matched_exercises}
        
        Recommended Exercises based on message:
        {matched_exercises}
        """

        openai_messages = [
            {
                "role": "system",
                "content": "You are MR-Fit AI Coach. You give personalized, specific workout and exercise recommendations. Keep responses concise (under 150 words). Always be encouraging.\n\n" + context_str
            }
        ]

        if req.messages:
            for m in req.messages:
                # Ensure valid role for openai
                role = "assistant" if m.role == "ai" or m.role == "assistant" else "user"
                # Skip welcome message if it's the exact one we put
                if role == "assistant" and "Hi" in m.content and "I'm your MR-Fit AI Coach" in m.content:
                    continue
                openai_messages.append({"role": role, "content": m.content})
        else:
            openai_messages.append({"role": "user", "content": user_message_text})

        # 6. Call OpenAI
        if not OPENAI_API_KEY:
            # Fallback if no openai key, return dummy response
            return {
                "reply": "I'm sorry, my AI backend is not configured with an OpenAI API key yet.",
                "exercises": matched_exercises
            }

        try:
            async with httpx.AsyncClient() as client:
                ai_res = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {OPENAI_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-4o-mini",
                        "messages": openai_messages,
                        "max_tokens": 200,
                        "temperature": 0.7
                    },
                    timeout=30.0
                )
                ai_res.raise_for_status()
                ai_data = ai_res.json()
                reply_text = ai_data["choices"][0]["message"]["content"]

            return {
                "reply": reply_text,
                "exercises": matched_exercises
            }
        except Exception as e:
            print("OpenAI API error:", str(e))
            return {
                "reply": "I'm having trouble reaching my AI backend right now. Please try again in a moment.",
                "exercises": matched_exercises
            }
        
    except Exception as e:
        print("Error processing AI recommendation:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
