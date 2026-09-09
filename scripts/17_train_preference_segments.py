"""Train the guest preference segmentation model used by the Flask API.

This creates a balanced DEMO training set. Replace it with anonymised survey or
hotel preference ratings for the final research model, then run this script
again with the same eight feature columns.
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = PROJECT_ROOT / "data" / "processed" / "guest_preference_training_demo.csv"
MODEL_PATH = PROJECT_ROOT / "models" / "preference_segment_kmeans.joblib"
SCALER_PATH = PROJECT_ROOT / "models" / "preference_segment_scaler.joblib"
METADATA_PATH = PROJECT_ROOT / "models" / "preference_segment_metadata.json"

FEATURES = [
    "Nature_Interest", "Culture_Interest", "Adventure_Interest", "Food_Interest",
    "Wellness_Interest", "Entertainment_Interest", "Shopping_Interest", "Family_Interest",
]
DISPLAY_NAMES = {"Food": "Culinary"}

# Each archetype deliberately represents a different hospitality preference.
ARCHETYPES = {
    "Nature & Wellness": [5, 2, 2, 1, 5, 1, 1, 1],
    "Nature & Adventure": [5, 1, 5, 1, 2, 2, 1, 2],
    "Culture & Food": [1, 5, 1, 5, 1, 2, 2, 2],
    "Family & Entertainment": [2, 1, 2, 2, 1, 5, 1, 5],
    "Shopping & Food": [1, 2, 1, 5, 1, 2, 5, 1],
    "Balanced Experience": [3, 3, 3, 3, 3, 3, 3, 3],
}


def create_demo_training_data(rows_per_archetype: int = 180) -> pd.DataFrame:
    rng = np.random.default_rng(42)
    records = []
    for archetype, centre in ARCHETYPES.items():
        values = rng.normal(loc=centre, scale=0.55, size=(rows_per_archetype, len(FEATURES)))
        values = np.clip(np.rint(values), 1, 5).astype(int)
        for row in values:
            records.append({"Seed_Archetype": archetype, **dict(zip(FEATURES, row))})
    return pd.DataFrame(records)


def profile_label(values: pd.Series) -> str:
    if values.max() - values.min() < 0.4:
        return "Balanced Experience Explorer"
    top = values.sort_values(ascending=False).head(2).index
    names = [DISPLAY_NAMES.get(feature.replace("_Interest", ""), feature.replace("_Interest", "")) for feature in top]
    return f"{names[0]} & {names[1]} Explorer"


def main() -> None:
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)

    data = create_demo_training_data()
    data.to_csv(DATA_PATH, index=False)

    scaler = StandardScaler()
    scaled = scaler.fit_transform(data[FEATURES])
    model = KMeans(n_clusters=len(ARCHETYPES), random_state=42, n_init=30)
    data["Cluster"] = model.fit_predict(scaled)
    quality_score = round(float(silhouette_score(scaled, data["Cluster"])), 4)
    profiles = data.groupby("Cluster")[FEATURES].mean().round(2)
    profiles.to_csv(PROJECT_ROOT / "data" / "processed" / "preference_cluster_profiles.csv")

    metadata = {
        "trainingData": "balanced synthetic demonstration data",
        "silhouetteScore": quality_score,
        "features": FEATURES,
        "clusters": {
            str(cluster): {"name": profile_label(profile), "centroid": profile.to_dict()}
            for cluster, profile in profiles.iterrows()
        },
    }
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    METADATA_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print("Saved model:", MODEL_PATH)
    print("Saved cluster profiles:", PROJECT_ROOT / "data" / "processed" / "preference_cluster_profiles.csv")
    print("Silhouette score:", quality_score)
    print(profiles)


if __name__ == "__main__":
    main()
