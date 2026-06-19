import json
import re
from typing import Any, Dict, List, Optional

_JSON_FENCE_RE = re.compile(r"```(?:json)?\s*|\s*```", re.IGNORECASE)
_JSON_ARRAY_RE = re.compile(r"\[[\s\S]*\]")
_JSON_OBJECT_RE = re.compile(r"\{[\s\S]*\}")

_WORKOUT_HINTS = (
    "workout",
    "exercise",
    "training",
    "lift",
    "gym",
    "sets",
    "reps",
    "rep",
    "weight",
    "bench",
    "press",
    "squat",
    "deadlift",
    "row",
    "curl",
    "lunge",
    "plank",
    "cardio",
    "run",
    "bike",
    "cycle",
    "walk",
    "sprint",
    "hiit",
    "leg",
    "legs",
    "quad",
    "quads",
    "hamstring",
    "hamstrings",
    "glute",
    "glutes",
    "calf",
    "calves",
    "core",
    "abs",
    "shoulder",
    "shoulders",
    "arm",
    "arms",
    "back",
    "chest",
)
_FOOD_HINTS = (
    "food",
    "meal",
    "calorie",
    "calories",
    "protein",
    "carb",
    "carbs",
    "fat",
    "breakfast",
    "lunch",
    "dinner",
    "snack",
    "eat",
    "ate",
    "had",
)
_FALLBACK_PREFIX_RE = re.compile(
    r"^\s*(?:i\s+need|i'd\s+like|i\s+would\s+like|i\s+want|want|need|looking\s+for|give\s+me|show\s+me|suggest|recommend|log|add|track|help\s+me\s+with|can\s+you\s+give\s+me)\b[\s,:-]*",
    re.IGNORECASE,
)
_FILLER_WORDS_RE = re.compile(r"\b(?:a|an|the|good|great|best|nice|solid|quick|easy|simple|strong|effective|some)\b", re.IGNORECASE)


def extract_json_payload(raw_text: str) -> str:
    cleaned = raw_text.strip()
    cleaned = _JSON_FENCE_RE.sub("", cleaned).strip()

    array_match = _JSON_ARRAY_RE.search(cleaned)
    if array_match:
        return array_match.group(0)

    object_match = _JSON_OBJECT_RE.search(cleaned)
    if object_match:
        return object_match.group(0)

    return cleaned


def load_json_payload(raw_text: str) -> Any:
    return json.loads(extract_json_payload(raw_text))


def _coerce_int(value: Any) -> Optional[int]:
    if value is None or value == "":
        return None

    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _coerce_float(value: Any) -> Optional[float]:
    if value is None or value == "":
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _clean_fallback_name(text: str) -> str:
    cleaned = text.strip().strip("`\"'").rstrip(".!?")
    cleaned = _FALLBACK_PREFIX_RE.sub("", cleaned)
    cleaned = _FILLER_WORDS_RE.sub("", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" ,:-")
    return cleaned or text.strip().strip("`\"'").rstrip(".!?") or "Workout"


def _contains_hint(text: str, hint: str) -> bool:
    return re.search(rf"\b{re.escape(hint)}\b", text) is not None


def build_fallback_item(text: str, prefill_exercise: Optional[str] = None) -> Optional[Dict[str, Any]]:
    if prefill_exercise:
        name = prefill_exercise.strip()
        if name:
            return {
                "type": "EXERCISE",
                "name": name,
                "calories": None,
                "sets": None,
                "reps": None,
                "weight": None,
                "volume": None,
            }

    lowered = text.lower()
    if any(_contains_hint(lowered, hint) for hint in _WORKOUT_HINTS):
        name = _clean_fallback_name(text)
        return {
            "type": "EXERCISE",
            "name": name,
            "calories": None,
            "sets": None,
            "reps": None,
            "weight": None,
            "volume": None,
        }

    if any(_contains_hint(lowered, hint) for hint in _FOOD_HINTS):
        name = _clean_fallback_name(text)
        return {
            "type": "NUTRITION",
            "name": name,
            "calories": None,
            "sets": None,
            "reps": None,
            "weight": None,
            "volume": None,
        }

    return None


def normalize_parsed_items(raw_value: Any, *, text: str, prefill_exercise: Optional[str] = None) -> List[Dict[str, Any]]:
    if isinstance(raw_value, str):
        raw_value = load_json_payload(raw_value)

    if not isinstance(raw_value, list):
        raw_value = [raw_value]

    parsed_items: List[Dict[str, Any]] = []
    for item in raw_value:
        if not isinstance(item, dict):
            continue

        item_type = item.get("type")
        if item_type not in ("EXERCISE", "NUTRITION"):
            continue

        name = str(item.get("name", "")).strip()
        if not name:
            continue

        normalized = dict(item)
        normalized["type"] = item_type
        normalized["name"] = name

        if item_type == "EXERCISE":
            sets = _coerce_int(item.get("sets"))
            reps = _coerce_int(item.get("reps"))
            weight = _coerce_float(item.get("weight"))

            normalized["sets"] = sets
            normalized["reps"] = reps
            normalized["weight"] = weight
            normalized["calories"] = _coerce_int(item.get("calories"))
            normalized["volume"] = round(max(sets or 1, 1) * max(reps or 0, 0) * max(weight or 0.0, 0.0), 2)
        else:
            normalized["calories"] = _coerce_int(item.get("calories"))
            normalized["sets"] = None
            normalized["reps"] = None
            normalized["weight"] = None
            normalized["volume"] = None

        parsed_items.append(normalized)

    if not parsed_items:
        fallback_item = build_fallback_item(text, prefill_exercise)
        if fallback_item:
            parsed_items.append(fallback_item)

    return parsed_items
