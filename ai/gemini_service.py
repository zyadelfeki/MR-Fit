import os
import json
import logging
from typing import Optional, List, Dict, Any
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

GEMINI_KEY = os.getenv("GEMINI_API_KEY")
gemini_client: Optional[genai.Client] = None

if GEMINI_KEY:
    try:
        gemini_client = genai.Client(api_key=GEMINI_KEY)
        logger.info("Gemini client initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini client: {e}")
else:
    logger.warning("GEMINI_API_KEY is not set. Gemini features will be unavailable, falling back to Ollama.")

def is_gemini_available() -> bool:
    """Returns True if the Gemini client is initialized and ready."""
    return gemini_client is not None

def parse_magic_input(text: str, prefill_exercise: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Send natural language text to Gemini and get back a list of parsed fitness/nutrition items.
    """
    if not is_gemini_available():
        raise RuntimeError("Gemini service is not configured (missing GEMINI_API_KEY).")

    prompt = f"""
User input: "{text}"
Prefilled Exercise: "{prefill_exercise or 'None'}"

Task: Extract EVERY fitness or nutrition item mentioned from the user input.
- If the user mentions food (e.g. 'foul', 'taameya', 'chicken', 'salad'), set type to NUTRITION and estimate calories if not explicitly mentioned.
- If it describes a workout / exercise, set type to EXERCISE and map to a standard exercise name.
- If a Prefilled Exercise name is provided, use that as the exercise name.
- If a user specifies multiple sets for an exercise (e.g., 'bench press 30kg for 10 and 50kg for 8' or '3 sets of 10 at 50kg'), return an array of objects, one for each individual set. For '3 sets of 10 at 50kg', return 3 objects with reps=10 and weight=50. Each object represents one set, so the 'sets' value should be 1 or omitted.
- Return ONLY a valid JSON LIST of objects (even if there is only one item) with these fields (omit fields that don't apply):
  [{{"type": "EXERCISE" | "NUTRITION", "name": "<string>", "calories": <int|null>, "sets": <int|null>, "reps": <int|null>, "weight": <float|null>}}]
- No markdown, no explanation, just the JSON list.
"""
    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        data_list = json.loads(response.text)
    except Exception as e:
        logger.error(f"Gemini parse error: {e}")
        raise RuntimeError(f"AI parse failed: {str(e)}")

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

    if not parsed_items:
        raise ValueError("AI returned unexpected format or empty list")

    return parsed_items

def get_coach_advice_gemini(user_context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate coaching recommendations using Gemini 2.5 Flash.
    """
    if not is_gemini_available():
        raise RuntimeError("Gemini service is not configured (missing GEMINI_API_KEY).")

    prompt = f"""
You are an expert fitness coach AI. Analyze the following user analytics summary and provide personalized coaching advice.

User Analytics (last {user_context.get("period_days", 14)} days):
{json.dumps(user_context, indent=2, default=str)}

Respond ONLY with a valid JSON object using this exact schema:
{{
  "summary": "<2-3 sentence overview of the user's current fitness status>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "recommendations": ["<actionable recommendation 1>", "<actionable recommendation 2>", ...],
  "next_workout": [
    {{"exercise": "<name>", "sets": <int>, "reps": <int>, "weight": <float or null>, "notes": "<brief note>"}}
  ]
}}

Guidelines:
- Be specific and actionable, reference the user's actual numbers.
- If muscle balance data shows imbalances, address them.
- Recommend progressive overload based on their PR history.
- If nutrition data is sparse, mention the importance of tracking.
- Suggest a concrete next workout (4-6 exercises) that addresses weaknesses.
- No markdown, no explanation outside the JSON.
"""
    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        result = json.loads(response.text)
    except Exception as e:
        logger.error(f"Gemini Coach advice error: {e}")
        raise RuntimeError(f"Gemini Coach advice failed: {str(e)}")

    return {
        "summary": result.get("summary", ""),
        "strengths": result.get("strengths", []),
        "weaknesses": result.get("weaknesses", []),
        "recommendations": result.get("recommendations", []),
        "next_workout": result.get("next_workout", []),
    }

def ask_coach_gemini(question: str, user_context: Dict[str, Any], history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Conversational chat with Gemini 2.5 Flash.
    """
    if not is_gemini_available():
        raise RuntimeError("Gemini service is not configured (missing GEMINI_API_KEY).")

    history_block = ""
    if history:
        turns = []
        for turn in history:
            role = turn.get("role", "user").capitalize()
            text = str(turn.get("text", "")).strip()
            if text:
                turns.append(f"{role}: {text}")
        if turns:
            history_block = "\n=== CONVERSATION HISTORY (most recent last) ===\n" + "\n".join(turns) + "\n"

    prompt = f"""
You are a conversational fitness coach AI. The user is asking you a question about their training. Use the analytics summary below to give a helpful, data-driven answer.

=== USER ANALYTICS (last {user_context.get("period_days", 14)} days) ===
{json.dumps(user_context, indent=2, default=str)}
{history_block}
=== CURRENT USER QUESTION ===
"{question}"

=== RESPONSE RULES ===
1. Answer the user's question directly and concisely. Use prior conversation history for context if relevant.
2. Reference their actual numbers (PRs, volume, frequency, muscle balance, etc.) when relevant.
3. If the user asks "what should I train today" or similar:
   - Check their last_workout_date and muscle_balance to decide which muscle groups need work.
   - Consider recovery time (avoid training the same group two days in a row).
   - Prioritize weak/under-trained muscle groups from the muscle_balance data.
   - Populate the workout_plan array with 4-6 exercises.
4. If the user asks about progression, analyze personal_records and exercise_progression history.
5. If nutrition_days_logged is low or avg_daily_calories is 0, mention the importance of nutrition tracking.
6. Keep the answer practical, specific, and under 200 words.
7. No markdown formatting in the answer text.

Respond ONLY with a valid JSON object using this exact schema:
{{
  "answer": "<direct answer to the user's question>",
  "workout_plan": [
    {{"exercise": "<name>", "sets": <int>, "reps": <int>, "weight": <float or null>, "notes": "<brief note>"}}
  ]
}}

If the question does not warrant a workout plan, return an empty array for workout_plan.
No markdown, no explanation outside the JSON.
"""
    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        result = json.loads(response.text)
    except Exception as e:
        logger.error(f"Gemini Coach chat error: {e}")
        raise RuntimeError(f"Gemini Coach chat failed: {str(e)}")

    return {
        "answer": result.get("answer", ""),
        "workout_plan": result.get("workout_plan", []),
    }
