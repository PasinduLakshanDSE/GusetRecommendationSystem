"""Train a multi-label staff-action recommender for the guest AI workflow.

The generated rows are labelled demonstration data, not operational hotel
history. Replace the CSV with staff-approved historical actions when available,
then rerun this script using the same feature and label columns.
"""
from pathlib import Path
import random

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.multiclass import OneVsRestClassifier


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DATA = ROOT / "data" / "processed" / "staff_action_training_demo.csv"
OUTPUT_MODEL = ROOT / "models" / "staff_action_recommender.joblib"
INTERESTS = ["Nature", "Culture", "Adventure", "Food", "Wellness", "Entertainment", "Shopping", "Family"]
PURPOSES = ["Leisure", "Family Holiday", "Honeymoon", "Wellness", "Adventure", "Business"]
ACTIONS = [
    "Prepare reliable Wi-Fi and an in-room workspace",
    "Arrange express check-in and flexible arrival support",
    "Offer a short after-hours experience plan",
    "Confirm family room setup and child amenities",
    "Share child-friendly activity times and transport options",
    "Arrange a romantic welcome and private dining option",
    "Offer spa or wellness appointment times",
    "Prepare a quiet room and restful arrival experience",
    "Confirm guided adventure safety, weather, and transport",
    "Prepare a nature activity briefing and suitable timing",
    "Share a local culture and heritage itinerary",
    "Confirm dietary dining options before arrival",
    "Review accessibility needs and prepare appropriate support",
    "Curate local entertainment options for the preferred time",
    "Prepare a local shopping and artisan-market guide",
]


def action_labels(row):
    labels = set()
    purpose = row["purpose"]
    if purpose == "Business":
        labels.update(ACTIONS[:3])
    if purpose == "Family Holiday" or row["Family"] >= 4 or row["children"] > 0:
        labels.update(ACTIONS[3:5])
    if purpose == "Honeymoon":
        labels.add(ACTIONS[5])
    if purpose == "Wellness" or row["Wellness"] >= 4:
        labels.update(ACTIONS[6:8])
    if purpose == "Adventure" or row["Adventure"] >= 4:
        labels.add(ACTIONS[8])
    if row["Nature"] >= 4:
        labels.add(ACTIONS[9])
    if row["Culture"] >= 4:
        labels.add(ACTIONS[10])
    if row["Food"] >= 4 or row["foodPreference"]:
        labels.add(ACTIONS[11])
    if row["accessibility"]:
        labels.add(ACTIONS[12])
    if row["Entertainment"] >= 4:
        labels.add(ACTIONS[13])
    if row["Shopping"] >= 4:
        labels.add(ACTIONS[14])
    if not labels:
        labels.update([ACTIONS[7], ACTIONS[11]])
    return labels


def main():
    rng = random.Random(20260911)
    rows = []
    for _ in range(3200):
        purpose = rng.choice(PURPOSES)
        row = {
            "purpose": purpose,
            "stayDuration": rng.randint(1, 10),
            "adults": rng.randint(1, 4),
            "children": rng.choices([0, 1, 2, 3], weights=[70, 15, 10, 5])[0],
            "budgetValue": rng.choice([1, 2, 3, 4]),
            "foodPreference": rng.choices([0, 1], weights=[55, 45])[0],
            "accessibility": rng.choices([0, 1], weights=[91, 9])[0],
        }
        for interest in INTERESTS:
            row[interest] = 5 if rng.random() < 0.28 else 1
        purpose_interest = {
            "Family Holiday": "Family", "Honeymoon": "Wellness", "Wellness": "Wellness",
            "Adventure": "Adventure", "Leisure": "Nature",
        }.get(purpose)
        if purpose_interest and rng.random() < 0.62:
            row[purpose_interest] = 5
        if row["children"]:
            row["Family"] = 5
        labels = action_labels(row)
        row.update({f"action__{action}": int(action in labels) for action in ACTIONS})
        rows.append(row)

    data = pd.DataFrame(rows)
    purpose_columns = [f"purpose__{purpose}" for purpose in PURPOSES]
    for purpose in PURPOSES:
        data[f"purpose__{purpose}"] = (data["purpose"] == purpose).astype(int)
    feature_columns = INTERESTS + ["stayDuration", "adults", "children", "budgetValue", "foodPreference", "accessibility"] + purpose_columns
    label_columns = [f"action__{action}" for action in ACTIONS]
    model = OneVsRestClassifier(RandomForestClassifier(n_estimators=180, min_samples_leaf=2, random_state=42, n_jobs=-1))
    model.fit(data[feature_columns], data[label_columns])
    OUTPUT_DATA.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_MODEL.parent.mkdir(parents=True, exist_ok=True)
    data.to_csv(OUTPUT_DATA, index=False)
    joblib.dump({"model": model, "feature_columns": feature_columns, "actions": ACTIONS, "training_note": "Synthetic labelled demonstration data. Replace with staff-approved historical outcomes for production."}, OUTPUT_MODEL)
    print(f"Saved training data: {OUTPUT_DATA}")
    print(f"Saved model: {OUTPUT_MODEL}")


if __name__ == "__main__":
    main()
