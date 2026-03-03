# MR-Fit API Contract

All REST endpoints are Next.js Route Handlers living at `/app/api/**`.  
Authentication uses a Supabase JWT passed as `Authorization: Bearer <token>`.

---

## Authentication

### POST `/api/auth/sign-up`

Create a new user account.

**Request body**
```json
{
  "email": "user@example.com",
  "password": "min8chars"
}
```

**Response `201`**
```json
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "session": { "access_token": "...", "refresh_token": "..." }
}
```

---

### POST `/api/auth/sign-in`

**Request body**
```json
{
  "email": "user@example.com",
  "password": "min8chars"
}
```

**Response `200`**
```json
{
  "session": { "access_token": "...", "refresh_token": "...", "expires_at": 1234567890 }
}
```

---

## Profile

### GET `/api/profile`

Returns the authenticated user's profile.

**Response `200`**
```json
{
  "id": "uuid",
  "display_name": "Alex",
  "date_of_birth": "1995-04-12",
  "gender": "male",
  "height_cm": 180.5,
  "weight_kg": 78.0,
  "fitness_goal": "build_muscle",
  "fitness_level": "intermediate"
}
```

---

### PATCH `/api/profile`

Update one or more profile fields.

**Request body** (all fields optional)
```json
{
  "display_name": "Alex",
  "weight_kg": 76.5,
  "fitness_goal": "lose_weight"
}
```

**Response `200`** – updated profile object.

---

## Workouts

### GET `/api/workouts`

Returns the authenticated user's workouts, newest first.

**Query parameters**

| Param | Type | Description |
|---|---|---|
| `limit` | integer | Max rows to return (default 20, max 100) |
| `offset` | integer | Pagination offset (default 0) |

**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Push Day A",
      "scheduled_at": "2026-03-05T08:00:00Z",
      "duration_min": 60,
      "source": "ai"
    }
  ],
  "count": 1
}
```

---

### POST `/api/workouts/generate`

Triggers the n8n `workout-plan-generator` webhook to produce an AI workout plan.

**Request body**
```json
{
  "days_per_week": 4,
  "preferred_duration_min": 60
}
```

**Response `201`** – the created workout object (inserted by n8n via service-role key).

---

### GET `/api/workouts/:id`

Returns a single workout with its exercises.

**Response `200`**
```json
{
  "id": "uuid",
  "title": "Push Day A",
  "exercises": [
    { "exercise_id": "uuid", "name": "Bench Press", "sets": 4, "reps": 8 }
  ]
}
```

---

## Workout Logs

### POST `/api/workout-logs`

Log a completed set for an exercise within a workout session.

**Request body**
```json
{
  "workout_id": "uuid",
  "exercise_id": "uuid",
  "sets_completed": 4,
  "reps_completed": 8,
  "weight_kg": 80,
  "notes": "Felt strong today"
}
```

**Response `201`** – created log object.

---

## Wearable Data

### POST `/api/wearable`

Ingest a batch of wearable metrics (called by n8n sync workflow).

**Request body**
```json
{
  "source": "garmin",
  "records": [
    { "metric": "heart_rate", "value": 72, "unit": "bpm", "recorded_at": "2026-03-03T07:00:00Z" },
    { "metric": "steps",      "value": 9843, "unit": "count", "recorded_at": "2026-03-03T23:59:00Z" }
  ]
}
```

**Response `201`**
```json
{ "inserted": 2 }
```

---

## Realtime Subscriptions (Supabase Realtime)

Clients can subscribe to changes using the Supabase client library.

| Channel | Table | Event | Use case |
|---|---|---|---|
| `workouts:user_id=eq.<id>` | workouts | INSERT | Notify when AI plan is ready |
| `workout_logs:user_id=eq.<id>` | workout_logs | INSERT | Live session tracking |
| `wearable_data:user_id=eq.<id>` | wearable_data | INSERT | Real-time metrics dashboard |

---

## Error format

All errors return a consistent JSON body:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "weight_kg must be a positive number"
  }
}
```
