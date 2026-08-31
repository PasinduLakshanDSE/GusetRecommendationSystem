from pathlib import Path

import joblib
import pandas as pd


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
    "data/processed/users_with_segments.csv"
)


FEATURES = [
    "Nature_Interest",
    "Culture_Interest",
    "Food_Interest",
    "Wellness_Interest",
    "Entertainment_Interest",
    "Shopping_Interest",
    "Family_Interest",
]


# IMPORTANT:
# These names come from the cluster profiles
# you already analysed.
SEGMENT_NAMES = {
    0: "Nature & Wellness Explorer",
    1: "Family Entertainment Explorer",
    2: "Shopping & Food Explorer",
}


def main():

    data = pd.read_csv(
        DATA_PATH
    )

    model = joblib.load(
        MODEL_PATH
    )

    scaler = joblib.load(
        SCALER_PATH
    )

    X = data[FEATURES]

    # Use SAME scaler used during training.
    X_scaled = scaler.transform(
        X
    )

    clusters = model.predict(
        X_scaled
    )

    data["Cluster"] = clusters

    data["Guest_Segment"] = (
        data["Cluster"].map(
            SEGMENT_NAMES
        )
    )

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    data.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print(
        "\nUsers assigned to segments:"
    )

    print(
        data[
            [
                "UserID",
                "Preferences",
                "Cluster",
                "Guest_Segment",
            ]
        ].head(20).to_string(
            index=False
        )
    )

    print(
        "\nSegment distribution:"
    )

    print(
        data[
            "Guest_Segment"
        ].value_counts()
    )

    print(
        f"\nSaved to: {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()