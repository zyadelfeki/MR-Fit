import os
import psycopg2
import psycopg2.extras
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("Error: Missing DATABASE_URL")
    exit(1)

model = SentenceTransformer("all-MiniLM-L6-v2")

def main():
    db = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
    cur = db.cursor()

    cur.execute("SELECT id, name, description, muscle_group, equipment, difficulty FROM exercises WHERE embedding IS NULL")
    exercises = cur.fetchall()

    if not exercises:
        print("Done! All exercises already embedded.")
        db.close()
        return

    print(f"Found {len(exercises)} exercises to embed.")
    total = 0

    for ex in exercises:
        text = f"{ex['name']}: {ex.get('description','')} Muscle group: {ex.get('muscle_group','')}. Equipment: {ex.get('equipment','')}. Difficulty: {ex.get('difficulty','')}"
        embedding = model.encode(text).tolist()
        embedding_str = "[" + ",".join(map(str, embedding)) + "]"

        cur.execute(
            "UPDATE exercises SET embedding = %s::vector WHERE id = %s",
            (embedding_str, ex['id'])
        )
        db.commit()
        total += 1
        print(f"Embedded {total}/{len(exercises)}: {ex['name']}")

    db.close()
    print(f"Done! Embedded {total} exercises.")

if __name__ == "__main__":
    main()
