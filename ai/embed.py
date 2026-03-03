import os
from supabase import create_client, Client
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
model = SentenceTransformer("all-MiniLM-L6-v2")

def main():
    print("Fetching exercises without embeddings...")
    
    # Fetch exercises where embedding is null
    response = supabase.table("exercises").select("*").is_("embedding", "null").execute()
    exercises = response.data
    
    if not exercises:
        print("Done! Embedded 0 exercises.")
        return
        
    print(f"Found {len(exercises)} exercises to embed.")
    
    batch_size = 10
    total_embedded = 0
    
    for i in range(0, len(exercises), batch_size):
        batch = exercises[i:i+batch_size]
        
        for exercise in batch:
            name = exercise.get("name", "")
            description = exercise.get("description", "")
            muscle_group = exercise.get("muscle_group", "")
            equipment = exercise.get("equipment", "")
            difficulty = exercise.get("difficulty", "")
            
            text_to_embed = f"{name}: {description} Muscle group: {muscle_group}. Equipment: {equipment}. Difficulty: {difficulty}"
            
            # Generate embedding
            # The model encode returns a numpy array, we need to convert to list.
            embedding = model.encode(text_to_embed).tolist()
            
            # Update row in supabase
            supabase.table("exercises").update({"embedding": embedding}).eq("id", exercise["id"]).execute()
            
            total_embedded += 1
            print(f"Embedded {total_embedded}/{len(exercises)}: {name}")
            
    print(f"Done! Embedded {total_embedded} exercises.")

if __name__ == "__main__":
    main()
