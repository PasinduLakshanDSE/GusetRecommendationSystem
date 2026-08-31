from pathlib import Path

import joblib
import pandas as pd


MODEL_PATH = Path(
    "models/kmeans_guest_segments.joblib"
)

SCALER_PATH = Path(
    "models/guest_segment_scaler.joblib"
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


SEGMENT_NAMES = {
    0: "Nature & Wellness Explorer",
    1: "Family Entertainment Explorer",
    2: "Shopping & Food Explorer",
}


def predict_segment(guest):

    model = joblib.load(
        MODEL_PATH
    )

    scaler = joblib.load(
        SCALER_PATH
    )

    frame = pd.DataFrame(
        [guest],
        columns=FEATURES
    )

    scaled = scaler.transform(
        frame
    )

    cluster = int(
        model.predict(scaled)[0]
    )

    segment = SEGMENT_NAMES.get(
        cluster,
        f"Cluster {cluster}"
    )

    return cluster, segment


def main():

    # Test guest
    guest = {
    "Nature_Interest": 1.0,
    "Culture_Interest": 1.5,
    "Food_Interest": 4.0,
    "Wellness_Interest": 1.0,
    "Entertainment_Interest": 3.0,
    "Shopping_Interest": 5.0,
    "Family_Interest": 1.5,
    }

    cluster, segment = predict_segment(
        guest
    )

    print("\nGuest Preferences:")

    for feature, value in guest.items():
        print(
            f"{feature}: {value}"
        )

    print(
        f"\nPredicted Cluster: {cluster}"
    )

    print(
        f"Guest Segment: {segment}"
    )


if __name__ == "__main__":
    main()