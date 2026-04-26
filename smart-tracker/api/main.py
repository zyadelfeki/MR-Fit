"""
api/main.py
===========
FastAPI backend for Smart Exercise Tracker.

Endpoints:
  POST /predict       — Classify exercise type from a sensor window
  POST /count-reps    — Count repetitions in a sensor sequence
  GET  /health        — Health check

Model artefact
--------------
The Random Forest classifier is trained in the project notebooks and saved as:
    smart-tracker/models/random_forest.pkl   (joblib format)

The same 7-statistic × 6-axis = 42-feature vector used during training is
reproduced here in `_extract_features()`.  If the model file is missing the
service starts in *degraded mode* and /predict returns HTTP 503 with a clear
error rather than silently returning a fake uniform distribution.
"""

import logging
import os
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logger = logging.getLogger("mrfit.api")
logging.basicConfig(level=logging.INFO)

# ---------------------------------------------------------------------------
# Model bootstrap — load at startup, fail loudly if the file is missing
# ---------------------------------------------------------------------------

MODEL_PATH = Path(__file__).parent.parent / "models" / "random_forest.pkl"

_classifier: Any = None
_label_encoder: Any = None


def _load_model() -> None:
    """Attempt to load the trained Random Forest + label encoder from disk."""
    global _classifier, _label_encoder

    if not MODEL_PATH.exists():
        logger.warning(
            "Model file not found at %s — /predict will return HTTP 503. "
            "Run the training notebook and save the artefact to continue.",
            MODEL_PATH,
        )
        return

    try:
        import joblib  # imported here so the service starts even without sklearn

        artefact = joblib.load(MODEL_PATH)

        # Support two formats:
        #   1. dict:  {"classifier": clf, "label_encoder": le}
        #   2. bare sklearn estimator (label names inferred from classes_)
        if isinstance(artefact, dict):
            _classifier = artefact["classifier"]
            _label_encoder = artefact.get("label_encoder")
        else:
            _classifier = artefact
            _label_encoder = None

        logger.info("Loaded model from %s", MODEL_PATH)
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to load model: %s", exc)


_load_model()

# ---------------------------------------------------------------------------
# Feature extraction
# ---------------------------------------------------------------------------

# Axes in the order expected by the feature matrix
_AXES = [
    "accelerometer_x",
    "accelerometer_y",
    "accelerometer_z",
    "gyroscope_x",
    "gyroscope_y",
    "gyroscope_z",
]

# 7 statistics computed per axis — must match the training notebook exactly
_STATS = ["mean", "std", "max", "min", "median", "skew", "kurtosis"]


def _extract_features(window: "SensorWindow") -> np.ndarray:
    """
    Extract a 42-dimensional feature vector from one sensor window.

    Feature order: for each axis (acc_x, acc_y, acc_z, gyr_x, gyr_y, gyr_z)
      [mean, std, max, min, median, skew, kurtosis]

    This mirrors the feature engineering step in the training notebooks.
    """
    from scipy.stats import kurtosis as scipy_kurtosis
    from scipy.stats import skew as scipy_skew

    raw: dict[str, list[float]] = {
        "accelerometer_x": window.accelerometer_x,
        "accelerometer_y": window.accelerometer_y,
        "accelerometer_z": window.accelerometer_z,
        "gyroscope_x": window.gyroscope_x,
        "gyroscope_y": window.gyroscope_y,
        "gyroscope_z": window.gyroscope_z,
    }

    feature_vec: list[float] = []
    for axis in _AXES:
        arr = np.asarray(raw[axis], dtype=float)
        if arr.size == 0:
            raise ValueError(f"Axis '{axis}' is empty.")
        feature_vec.extend([
            float(np.mean(arr)),
            float(np.std(arr)),
            float(np.max(arr)),
            float(np.min(arr)),
            float(np.median(arr)),
            float(scipy_skew(arr)),
            float(scipy_kurtosis(arr)),
        ])

    return np.asarray(feature_vec, dtype=float).reshape(1, -1)


def _class_names() -> list[str]:
    """Return the ordered class names from the loaded classifier."""
    if _label_encoder is not None and hasattr(_label_encoder, "classes_"):
        return list(_label_encoder.classes_)
    if _classifier is not None and hasattr(_classifier, "classes_"):
        return [str(c) for c in _classifier.classes_]
    # Fallback to the five exercise labels used in the dataset
    return ["bench", "dead", "ohp", "row", "squat"]


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="MR.FIT Smart Tracker API",
    description="AI-Powered Exercise Classification & Rep Counting",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        os.getenv("FRONTEND_URL", "*"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------


class SensorWindow(BaseModel):
    """One window of raw 6-DOF IMU readings (accelerometer + gyroscope)."""

    accelerometer_x: list[float]
    accelerometer_y: list[float]
    accelerometer_z: list[float]
    gyroscope_x: list[float]
    gyroscope_y: list[float]
    gyroscope_z: list[float]
    set_id: int = 1
    # Ground-truth label — used only during offline evaluation, not in production
    label: str | None = None


class PredictionResponse(BaseModel):
    exercise: str
    confidence: float
    probabilities: dict[str, float]
    model_loaded: bool


class RepCountResponse(BaseModel):
    exercise: str
    reps_predicted: int
    message: str


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "MR.FIT Smart Tracker API v2.0.0",
        "model_loaded": _classifier is not None,
        "model_path": str(MODEL_PATH),
    }


# ---------------------------------------------------------------------------
# Classify exercise  (real inference)
# ---------------------------------------------------------------------------


@app.post("/predict", response_model=PredictionResponse)
def predict_exercise(window: SensorWindow):
    """
    Classify exercise type from a window of accelerometer + gyroscope data.

    Returns the predicted exercise label, its probability, and the full
    probability distribution across all classes.
    """
    if _classifier is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Model not loaded. "
                f"Place the trained artefact at '{MODEL_PATH}' and restart the service."
            ),
        )

    # Validate that all axes have the same length
    axes_lengths = {
        k: len(getattr(window, k))
        for k in [
            "accelerometer_x", "accelerometer_y", "accelerometer_z",
            "gyroscope_x", "gyroscope_y", "gyroscope_z",
        ]
    }
    lengths = set(axes_lengths.values())
    if len(lengths) != 1:
        raise HTTPException(
            status_code=422,
            detail=f"All axes must have the same number of samples. Got: {axes_lengths}",
        )
    if min(lengths) < 2:
        raise HTTPException(
            status_code=422,
            detail="Each axis must contain at least 2 samples.",
        )

    try:
        features = _extract_features(window)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Feature extraction failed: {exc}") from exc

    try:
        proba = _classifier.predict_proba(features)[0]  # shape (n_classes,)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inference failed: {exc}") from exc

    class_names = _class_names()
    prob_map = {name: round(float(p), 4) for name, p in zip(class_names, proba)}
    best_idx = int(np.argmax(proba))
    predicted = class_names[best_idx]
    confidence = round(float(proba[best_idx]), 4)

    return PredictionResponse(
        exercise=predicted,
        confidence=confidence,
        probabilities=prob_map,
        model_loaded=True,
    )


# ---------------------------------------------------------------------------
# Count reps
# ---------------------------------------------------------------------------


@app.post("/count-reps", response_model=RepCountResponse)
def count_reps(window: SensorWindow, exercise: str = "bench"):
    """
    Count exercise repetitions from a full sensor set sequence.

    Uses the peak-detection RepCounter that operates on the resultant
    accelerometer magnitude signal.
    """
    from src.models.rep_counter import RepCounter

    try:
        df = pd.DataFrame(
            {
                "Accelerometer_x": window.accelerometer_x,
                "Accelerometer_y": window.accelerometer_y,
                "Accelerometer_z": window.accelerometer_z,
                "Gyroscope_x": window.gyroscope_x,
                "Gyroscope_y": window.gyroscope_y,
                "Gyroscope_z": window.gyroscope_z,
                "Set": window.set_id,
                "Label": exercise,
                "Category": "medium",
            }
        )
        df["Accelerometer_r"] = np.sqrt(
            df["Accelerometer_x"] ** 2
            + df["Accelerometer_y"] ** 2
            + df["Accelerometer_z"] ** 2
        )

        rc = RepCounter()
        reps = rc.count_reps(df, exercise)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Rep counting failed: {exc}") from exc

    return RepCountResponse(
        exercise=exercise,
        reps_predicted=reps,
        message=f"Detected {reps} repetitions of '{exercise}'.",
    )
