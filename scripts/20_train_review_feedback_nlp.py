"""Train review NLP and create feedback-derived hospitality action intelligence.

Source: the real Booking.com Hotel_Reviews.csv supplied with this project.
The score creates sentiment labels; TF-IDF + Logistic Regression is evaluated
on a held-out test split.  The resulting aspect risk table is used by the
guest-action prioritiser at runtime.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "raw" / "hotel_reviews" / "Hotel_Reviews.csv"
MODEL_PATH = ROOT / "models" / "review_feedback_nlp_model.joblib"
SUMMARY_PATH = ROOT / "data" / "processed" / "review_feedback_nlp_summary.json"
REPORT_PATH = ROOT / "data" / "processed" / "review_feedback_nlp_report.txt"
INTELLIGENCE_PATH = ROOT / "data" / "processed" / "review_feedback_action_intelligence.json"
SAMPLE_SIZE = 100_000

ASPECTS = {
    "Room": ["room", "bed", "bathroom", "shower", "air conditioning", "noise"],
    "Food": ["food", "breakfast", "restaurant", "dinner", "buffet", "meal"],
    "Staff service": ["staff", "service", "reception", "check in", "checkout", "manager"],
    "Cleanliness": ["clean", "dirty", "dust", "hygiene"],
    "Facilities": ["wifi", "wi fi", "internet", "parking", "lift", "elevator", "pool"],
    "Location": ["location", "distance", "area", "station", "transport"],
    "Wellness": ["spa", "massage", "wellness", "gym", "sauna", "relax"],
    "Value": ["price", "value", "money", "cost", "expensive"],
}


def normalise(text: object) -> str:
    text = str(text or "")
    text = re.sub(r"\bno (negative|positive)\b", "", text, flags=re.I)
    return re.sub(r"\s+", " ", text).strip()


def sentiment(score: float) -> str:
    if score <= 5.5:
        return "Negative"
    if score < 8.0:
        return "Neutral"
    return "Positive"


def contains(text: str, term: str) -> bool:
    return re.search(r"(?<!\w)" + re.escape(term) + r"(?!\w)", text) is not None


def main() -> None:
    if not DATA_PATH.exists() or DATA_PATH.stat().st_size < 10_000:
        raise FileNotFoundError(f"Real Hotel_Reviews.csv is not available at {DATA_PATH}")

    usecols = ["Negative_Review", "Positive_Review", "Reviewer_Score", "Tags"]
    chunks, rows_needed = [], SAMPLE_SIZE
    for chunk in pd.read_csv(DATA_PATH, usecols=usecols, chunksize=25_000):
        chunk = chunk.dropna(subset=["Reviewer_Score"])
        chunk["text"] = (chunk["Negative_Review"].map(normalise) + " " + chunk["Positive_Review"].map(normalise)).str.strip()
        chunk = chunk[chunk["text"].str.len() >= 12]
        chunks.append(chunk)
        rows_needed -= len(chunk)
        if rows_needed <= 0:
            break
    data = pd.concat(chunks, ignore_index=True).sample(n=min(SAMPLE_SIZE, sum(len(x) for x in chunks)), random_state=42)
    data["sentiment"] = data["Reviewer_Score"].astype(float).map(sentiment)

    x_train, x_test, y_train, y_test = train_test_split(
        data["text"], data["sentiment"], test_size=0.2, random_state=42, stratify=data["sentiment"]
    )
    model = Pipeline([
        ("tfidf", TfidfVectorizer(max_features=30_000, ngram_range=(1, 2), min_df=3, max_df=0.95, sublinear_tf=True)),
        ("classifier", LogisticRegression(max_iter=700, class_weight="balanced", solver="lbfgs", random_state=42)),
    ])
    model.fit(x_train, y_train)
    predicted = model.predict(x_test)
    accuracy = accuracy_score(y_test, predicted)
    macro_f1 = f1_score(y_test, predicted, average="macro")
    weighted_f1 = f1_score(y_test, predicted, average="weighted")

    negative = data[data["Reviewer_Score"].astype(float) <= 5.5].copy()
    negative_text = negative["Negative_Review"].map(normalise).str.lower()
    aspect_rows = []
    for aspect, terms in ASPECTS.items():
        mentions = sum(negative_text.map(lambda text: any(contains(text, term) for term in terms)))
        aspect_rows.append({"aspect": aspect, "negativeMentions": int(mentions), "negativeMentionRate": round(mentions / max(len(negative), 1) * 100, 2), "keywords": terms})
    aspects = sorted(aspect_rows, key=lambda item: item["negativeMentions"], reverse=True)

    summary = {
        "dataset": "Booking.com Hotel_Reviews.csv (real guest feedback)",
        "totalRowsUsed": int(len(data)), "trainingRows": int(len(x_train)), "testRows": int(len(x_test)),
        "algorithm": "TF-IDF (1-2 grams) + Logistic Regression", "accuracy": round(float(accuracy), 4),
        "macroF1": round(float(macro_f1), 4), "weightedF1": round(float(weighted_f1), 4),
        "classDistribution": {key: int(value) for key, value in data["sentiment"].value_counts().items()},
    }
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    SUMMARY_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    INTELLIGENCE_PATH.write_text(json.dumps({"source": summary["dataset"], "model": summary["algorithm"], "aspects": aspects}, indent=2), encoding="utf-8")
    REPORT_PATH.write_text(
        "REAL HOTEL REVIEW NLP TRAINING REPORT\n\n" + json.dumps(summary, indent=2) + "\n\nCLASSIFICATION REPORT\n" + classification_report(y_test, predicted, zero_division=0) + "\n\nNEGATIVE FEEDBACK ASPECTS\n" + "\n".join(f"- {a['aspect']}: {a['negativeMentions']:,} mentions ({a['negativeMentionRate']}%)" for a in aspects),
        encoding="utf-8",
    )
    print(json.dumps(summary, indent=2))
    print("\nTop negative-feedback aspects:")
    for item in aspects:
        print(f"- {item['aspect']}: {item['negativeMentions']:,} ({item['negativeMentionRate']}%)")
    print(f"\nSaved model: {MODEL_PATH}")
    print(f"Saved report: {REPORT_PATH}")


if __name__ == "__main__":
    main()
