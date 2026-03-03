"""
embed.py – Generate and upsert OpenAI embeddings for all exercises in Supabase.

Usage:
    python embed.py

Requires the following environment variables (or a .env.local file):
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
    OPENAI_API_KEY

The script:
    1. Fetches all exercises from the `exercises` table that have a NULL embedding.
    2. Builds a text representation for each exercise.
    3. Calls the OpenAI Embeddings API (text-embedding-3-small, 1536 dims).
    4. Upserts the embedding vector back into the `exercises` row.
"""

import os
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client, Client

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env.local"))

SUPABASE_URL: str = os.environ["SUPABASE_URL"]
SUPABASE_KEY: str = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
OPENAI_API_KEY: str = os.environ["OPENAI_API_KEY"]
EMBEDDING_MODEL = "text-embedding-3-small"

openai_client = OpenAI(api_key=OPENAI_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def build_exercise_text(exercise: dict) -> str:
    parts = [exercise["name"]]
    if exercise.get("description"):
        parts.append(exercise["description"])
    if exercise.get("muscle_group"):
        parts.append(f"Muscle group: {exercise['muscle_group']}")
    if exercise.get("equipment"):
        parts.append(f"Equipment: {exercise['equipment']}")
    if exercise.get("difficulty"):
        parts.append(f"Difficulty: {exercise['difficulty']}")
    return ". ".join(parts)


def embed_text(text: str) -> list[float]:
    response = openai_client.embeddings.create(input=text, model=EMBEDDING_MODEL)
    return response.data[0].embedding


def main() -> None:
    response = supabase.table("exercises").select("*").is_("embedding", "null").execute()
    exercises = response.data

    if not exercises:
        print("All exercises already have embeddings. Nothing to do.")
        return

    print(f"Embedding {len(exercises)} exercise(s)...")

    for exercise in exercises:
        text = build_exercise_text(exercise)
        vector = embed_text(text)
        supabase.table("exercises").update({"embedding": vector}).eq("id", exercise["id"]).execute()
        print(f"  ✓  {exercise['name']}")

    print("Done.")


if __name__ == "__main__":
    main()
