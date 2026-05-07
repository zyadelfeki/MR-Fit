"""Open Wearables webhook receiver.
Receives data pushed by the self-hosted Open Wearables service
and stores it in PostgreSQL for the AI coach to use.

Webhook payload reference:
https://github.com/the-momentum/open-wearables
"""
import os
import psycopg2
import psycopg2.extras
from fastapi import APIRouter, Request, HTTPException
from dotenv import load_dotenv
import json
from datetime import datetime

load_dotenv()

router = APIRouter(prefix="/wearables", tags=["wearables"])

DATABASE_URL = os.environ.get("DATABASE_URL")
OPEN_WEARABLES_SECRET = os.environ.get("OPEN_WEARABLES_SECRET", "")


def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)


@router.post("/webhook")
async def wearables_webhook(request: Request):
    """Receives data from Open Wearables and persists it."""
    # Optional secret validation
    if OPEN_WEARABLES_SECRET:
        sig = request.headers.get("x-wearables-secret", "")
        if sig != OPEN_WEARABLES_SECRET:
            raise HTTPException(status_code=401, detail="Invalid secret")

    payload = await request.json()

    user_id = payload.get("user_id")  # must be mapped on Open Wearables side
    data_type = payload.get("type")   # e.g. "daily", "sleep", "activity", "body"
    data = payload.get("data", {})

    if not user_id or not data_type:
        raise HTTPException(status_code=400, detail="Missing user_id or type")

    db = None
    try:
        db = get_db()
        cur = db.cursor()
        cur.execute("""
            INSERT INTO wearable_snapshots (user_id, data_type, payload, recorded_at)
            VALUES (%s::uuid, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (
            user_id,
            data_type,
            json.dumps(data),
            datetime.utcnow()
        ))
        db.commit()
    except Exception as e:
        print(f"[wearables] DB error: {e}")
        raise HTTPException(status_code=500, detail="DB write failed")
    finally:
        if db:
            db.close()

    return {"status": "ok"}


@router.get("/latest/{user_id}")
def get_latest_wearable_data(user_id: str):
    """Returns the most recent wearable snapshot per data type for a user."""
    db = None
    try:
        db = get_db()
        cur = db.cursor()
        cur.execute("""
            SELECT DISTINCT ON (data_type)
                data_type, payload, recorded_at
            FROM wearable_snapshots
            WHERE user_id = %s::uuid
            ORDER BY data_type, recorded_at DESC
        """, (user_id,))
        rows = cur.fetchall()
        return {"data": [dict(r) for r in rows]}
    except Exception as e:
        print(f"[wearables] fetch error: {e}")
        return {"data": []}
    finally:
        if db:
            db.close()
