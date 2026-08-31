from pathlib import Path

import joblib
import pandas as pd

from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler


DATA_PATH = Path(
    "data/processed/user_preference_vectors.csv"
)

MODEL_PATH = Path(
    "models/kmeans_guest_segments.joblib"
)

SCALER_PATH = Path(
    "models/guest_segment_scaler.joblib"
)

OUTPUT_PATH = Path(
    "data/processed/guest_segments.csv"
)

MODEL_PATH.parent.mkdir(
    parents=True,
    exist_ok=True
)


FEATURES = [
    "Nature_Interest",
    "Culture_Interest",
    "Adventure_Interest",
    "Food_Interest",
    "Wellness_Interest",
    "Entertainment_Interest",
    "Shopping_Interest",
    "Family_Interest",
]


def main():
    data = pd.read_csv(
        DATA_PATH
    )

    X = data[FEATURES]

    scaler = StandardScaler()

    X_scaled = scaler.fit_transform(
        X
    )

    print("Testing cluster numbers...\n")

    results = []

    for k in range(2, 9):

        model = KMeans(
            n_clusters=k,
            random_state=42,
            n_init=20
        )

        labels = model.fit_predict(
            X_scaled
        )

        score = silhouette_score(
            X_scaled,
            labels
        )

        results.append(
            (k, score)
        )

        print(
            f"K={k} "
            f"Silhouette={score:.4f}"
        )

    best_k = max(
        results,
        key=lambda item: item[1]
    )[0]

    print(
        f"\nBest cluster count: {best_k}"
    )

    model = KMeans(
        n_clusters=best_k,
        random_state=42,
        n_init=20
    )

    data["Cluster"] = model.fit_predict(
        X_scaled
    )

    # Save model.
    joblib.dump(
        model,
        MODEL_PATH
    )

    joblib.dump(
        scaler,
        SCALER_PATH
    )

    data.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print(
        f"\nModel saved: {MODEL_PATH}"
    )

    print(
        f"Results saved: {OUTPUT_PATH}"
    )

    print("\nCluster averages:")

    cluster_profiles = (
        data.groupby("Cluster")[FEATURES]
        .mean()
        .round(2)
    )

    print(cluster_profiles)

    print("\nComplete Cluster Profiles:")
    print(cluster_profiles.to_string())

    cluster_profiles.to_csv(
        "data/processed/cluster_profiles.csv"
    )

    print(
        "\nCluster profiles saved to: "
        "data/processed/cluster_profiles.csv"
    )


if __name__ == "__main__":
    main()
