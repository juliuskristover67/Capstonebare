
import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import numpy as np
import pickle
from contextlib import asynccontextmanager
from typing import List

import tensorflow as tf
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


# Schema input/output
class StudentFeatures(BaseModel):
    avg_clicks:    float = Field(..., description="Rata-rata klik per sesi")
    total_clicks:  float = Field(..., description="Total klik keseluruhan")
    active_weeks:  float = Field(..., description="Jumlah minggu aktif")
    is_late:       float = Field(..., description="1 jika pernah terlambat")
    is_submitted:  float = Field(..., description="1 jika pernah submit tugas")
    highest_education_HE_Qualification:             float = 0.0
    highest_education_Lower_Than_A_Level:           float = 0.0
    highest_education_No_Formal_quals:              float = 0.0
    highest_education_Post_Graduate_Qualification:  float = 0.0
    disability_Y:  float = 0.0

class PredictResponse(BaseModel):
    risk_probability: float
    risk_label:       int
    risk_level:       str
    message:          str

class BatchRequest(BaseModel):
    students: List[StudentFeatures]


# State global model (dimuat saat startup)
app_state = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[LearnGuard API] Loading model...")

    # Ambil folder tempat api.py berada
    base_dir = os.path.dirname(os.path.abspath(__file__))

    app_state["model"] = tf.keras.models.load_model(
        os.path.join(base_dir, "model.keras")
    )

    app_state["threshold"] = 0.5
    app_state["feature_names"] = FEATURE_ORDER # Add this line

    try:
        with open(os.path.join(base_dir, "threshold.pkl"), "rb") as f:
            app_state["threshold"] = pickle.load(f)
            print("Threshold loaded dari file.")
    except FileNotFoundError:
        print("threshold.pkl tidak ditemukan, pakai default 0.5")

    app_state["scaler"] = None
    try:
        with open(os.path.join(base_dir, "scaler.pkl"), "rb") as f:
            app_state["scaler"] = pickle.load(f)
        print("Scaler loaded.")
    except FileNotFoundError:
        print("PERINGATAN: scaler.pkl tidak ditemukan — data tidak akan di-scale!")

    print(f"[LearnGuard API] Ready. Threshold = {app_state['threshold']}")
    yield
    app_state.clear()

app = FastAPI(
    title       = "LearnGuard API",
    description = "REST API prediksi risiko ketertinggalan siswa",
    version     = "1.0.0",
    lifespan    = lifespan,
)

FEATURE_ORDER = [
    "avg_clicks", "total_clicks", "active_weeks", "is_late", "is_submitted",
    "highest_education_HE_Qualification",
    "highest_education_Lower_Than_A_Level",
    "highest_education_No_Formal_quals",
    "highest_education_Post_Graduate_Qualification",
    "disability_Y",
]

def to_array(student: StudentFeatures) -> np.ndarray:
    features = app_state["feature_names"]
    return np.array([[getattr(student, f) for f in features]], dtype=np.float32)

def risk_level(prob: float) -> str:
    if prob < 0.30: return "LOW"
    if prob < 0.55: return "MEDIUM"
    if prob < 0.75: return "HIGH"
    return "CRITICAL"


# Endpoints
@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": "LearnGuard API", "version": "1.0.0"}


@app.get("/model-info", tags=["Info"])
def model_info():
    return {
        "model_name" : "LearnGuard Neural Network",
        "threshold"  : app_state.get("threshold"),
        "features"   : FEATURE_ORDER,
        "n_features" : len(FEATURE_ORDER),
    }


@app.post("/predict", response_model=PredictResponse, tags=["Predict"])
def predict(student: StudentFeatures):
    try:
        model     = app_state["model"]
        threshold = app_state["threshold"]
        scaler    = app_state["scaler"]

        X = to_array(student)
        if scaler is not None:
            X = scaler.transform(X)

        prob  = float(model.predict(X, verbose=0)[0][0])
        label = int(prob >= threshold)
        level = risk_level(prob)
        msg = (
            "Risiko tinggi, disarankan intervensi segera."
            if label == 1 else
            "Risiko rendah, kondisi pembelajaran stabil."
        )

        return PredictResponse(
            risk_probability=round(prob, 4),
            risk_label=label,
            risk_level=level,
            message=msg,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict-batch", tags=["Predict"])
def predict_batch(request: BatchRequest):
    try:
        model     = app_state["model"]
        threshold = app_state["threshold"]
        scaler    = app_state["scaler"]

        X = np.vstack([to_array(s) for s in request.students])
        if scaler is not None:
            X = scaler.transform(X)

        probs  = model.predict(X, verbose=0).ravel()
        labels = (probs >= threshold).astype(int)

        return {
            "total"  : len(request.students),
            "at_risk": int(labels.sum()),
            "safe"   : int((labels == 0).sum()),
            "results": [
                {
                    "index"            : i,
                    "risk_probability" : round(float(probs[i]), 4),
                    "risk_label"       : int(labels[i]),
                    "risk_level"       : risk_level(float(probs[i])),
                }
                for i in range(len(request.students))
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
