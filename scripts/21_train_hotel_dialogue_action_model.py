"""Download DA_MultiWOZ_hotel and train a next hotel-action NLP classifier."""
from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


ROOT = Path(__file__).resolve().parents[1]
CACHE_PATH = ROOT / "data" / "raw" / "hotel_dialogue" / "da_multiwoz_hotel.csv"
MODEL_PATH = ROOT / "models" / "hotel_dialogue_action_model.joblib"
SUMMARY_PATH = ROOT / "data" / "processed" / "hotel_dialogue_action_summary.json"
REPORT_PATH = ROOT / "data" / "processed" / "hotel_dialogue_action_report.txt"
API = "https://datasets-server.huggingface.co/rows"


def download_dataset() -> pd.DataFrame:
    rows, offset = [], 0
    while True:
        query = urlencode({"dataset": "vidhikatkoria/DA_MultiWOZ_hotel", "config": "default", "split": "train", "offset": offset, "length": 100})
        with urlopen(f"{API}?{query}", timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8"))
        batch = [item["row"] for item in payload.get("rows", [])]
        rows.extend(batch)
        if len(batch) < 100:
            break
        offset += len(batch)
    data = pd.DataFrame(rows)
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    data.to_csv(CACHE_PATH, index=False)
    return data


def main() -> None:
    data = pd.read_csv(CACHE_PATH) if CACHE_PATH.exists() else download_dataset()
    # The hotel subset has some non-hotel labels; use only operational hotel
    # and booking acts for the action model shown to hotel staff.
    data = data[data["act"].astype(str).str.startswith(("Hotel-", "Booking-"))].dropna(subset=["context", "act"])
    counts = data["act"].value_counts()
    data = data[data["act"].isin(counts[counts >= 5].index)].copy()
    x_train, x_test, y_train, y_test = train_test_split(data["context"], data["act"], test_size=0.2, random_state=42, stratify=data["act"])
    model = Pipeline([
        ("tfidf", TfidfVectorizer(max_features=12_000, ngram_range=(1, 2), min_df=2, sublinear_tf=True)),
        ("classifier", LogisticRegression(max_iter=1000, class_weight="balanced", solver="lbfgs", random_state=42)),
    ])
    model.fit(x_train, y_train)
    predicted = model.predict(x_test)
    summary = {
        "dataset": "DA_MultiWOZ_hotel (Hugging Face)", "task": "Next hotel dialogue action prediction",
        "totalRows": int(len(data)), "trainingRows": int(len(x_train)), "testRows": int(len(x_test)),
        "algorithm": "TF-IDF (1-2 grams) + Logistic Regression",
        "accuracy": round(float(accuracy_score(y_test, predicted)), 4),
        "macroF1": round(float(f1_score(y_test, predicted, average="macro")), 4),
        "actionLabels": sorted(data["act"].unique().tolist()),
    }
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    SUMMARY_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    REPORT_PATH.write_text("HOTEL DIALOGUE ACTION MODEL REPORT\n\n" + json.dumps(summary, indent=2) + "\n\n" + classification_report(y_test, predicted, zero_division=0), encoding="utf-8")
    print(json.dumps(summary, indent=2))
    print(f"\nSaved cached dataset: {CACHE_PATH}")
    print(f"Saved model: {MODEL_PATH}")
    print(f"Saved report: {REPORT_PATH}")


if __name__ == "__main__":
    main()
