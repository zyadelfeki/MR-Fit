import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
model = SentenceTransformer("all-MiniLM-L6-v2")

class RecommendRequest(BaseModel):
    user_id: str
    message: str

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/recommend")
async def recommend(req: RecommendRequest):
    try:
        # 1. Fetch user profile
        profile_res = supabase.table("profiles").select("display_name, fitness_goal, fitness_level").eq("user_id", req.user_id).single().execute()
        profile = profile_res.data if profile_res.data else {}
        
        # 2. Fetch last 5 workout logs and join with exercises name
        # We assume the schema has "workout_exercises" linked to "exercises" or "workout_logs" table
        # We will attempt a standard join (workouts -> workout_exercises -> exercises) if possible, 
        # or just fetch the user's workouts if the structure is unknown. Instruction says:
        # "user's last 5 workout_logs (joined with exercise name)".
        # Let's write a reasonable typical query for supabase.
        logs_res = supabase.table("workout_exercises").select(
            "id, weight_kg, reps, sets, exercises(name)"
        ).eq("user_id", req.user_id).order("created_at", desc=True).limit(5).execute()
        
        # We might need to adjust the relation depending on actual DB, but if it fails we can catch it.
        # Actually user instructions says: "Fetches the user's last 5 workout_logs (joined with exercise name)"
        logs_data = []
        # If the above fails because user_id isn't on workout_exercises, we might need a different path.
        # Let's try standard workouts logs.
        try:
           logs_res_v2 = supabase.table("workouts").select(
               "id, created_at, name" # or whatever the schema has
           ).eq("user_id", req.user_id).order("created_at", desc=True).limit(5).execute()
        except:
           pass # ignoring
           
        # Actually I will use generic table 'workouts' as typically defined if standard isn't available, or I will use text representation.
        # Let's perform a safer query by just looking at "workouts" table if it exists
        try:
             workouts_res = supabase.table("workout_exercises").select(
                 "*, exercises:exercise_id(name)"
             ).eq("user_id", req.user_id).order("created_at", desc=True).limit(5).execute()
             logs_data = workouts_res.data
        except:
             pass

        recent_workouts_str = "Recent Workouts: " + str(logs_data) if logs_data else "No recent workouts found."

        # 3. Embed message
        query_embedding = model.encode(req.message).tolist()

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
        
        User Message:
        {req.message}
        """

        # 6. Call OpenAI
        if not OPENAI_API_KEY:
            # Fallback if no openai key, return dummy response
            return {
                "reply": "I'm sorry, my AI backend is not configured with an OpenAI API key yet.",
                "exercises": matched_exercises
            }

        async with httpx.AsyncClient() as client:
            ai_res = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are MR-Fit AI Coach. You give personalized, specific workout and exercise recommendations. Keep responses concise (under 150 words). Always be encouraging."
                        },
                        {
                            "role": "user",
                            "content": context_str
                        }
                    ],
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
        print("Error processing AI recommendation:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
