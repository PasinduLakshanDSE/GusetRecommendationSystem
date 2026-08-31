from pathlib import Path
import json

import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


DATA_PATH = Path(
    "data/processed/hotel_booking_clean.csv"
)

MODEL_PATH = Path(
    "models/booking_cancellation_model.joblib"
)

METADATA_PATH = Path(
    "models/booking_cancellation_metadata.json"
)

MODEL_PATH.parent.mkdir(
    parents=True,
    exist_ok=True
)


TARGET = "is_canceled"


CATEGORICAL_FEATURES = [
    "hotel",
    "arrival_date_month",
    "meal",
    "country",
    "market_segment",
    "distribution_channel",
    "reserved_room_type",
    "deposit_type",
    "customer_type",
]


NUMERICAL_FEATURES = [
    "lead_time",
    "stays_in_weekend_nights",
    "stays_in_week_nights",
    "adults",
    "children",
    "babies",
    "is_repeated_guest",
    "previous_cancellations",
    "previous_bookings_not_canceled",
    "adr",
    "required_car_parking_spaces",
    "total_of_special_requests",
    "total_nights",
    "total_guests",
]


FEATURES = (
    CATEGORICAL_FEATURES
    + NUMERICAL_FEATURES
)


def main():

    print("Loading cleaned booking data...")

    data = pd.read_csv(
        DATA_PATH
    )

    X = data[FEATURES]
    y = data[TARGET]

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=0.20,
            random_state=42,
            stratify=y,
        )
    )

    print(
        f"Training rows: {len(X_train):,}"
    )

    print(
        f"Testing rows: {len(X_test):,}"
    )

    # ----------------------------------
    # Preprocessing
    # ----------------------------------

    preprocessor = ColumnTransformer(
        [
            (
                "categorical",
                OneHotEncoder(
                    handle_unknown="ignore"
                ),
                CATEGORICAL_FEATURES,
            ),

            (
                "numerical",
                "passthrough",
                NUMERICAL_FEATURES,
            ),
        ]
    )

    # ----------------------------------
    # Random Forest
    # ----------------------------------

    classifier = RandomForestClassifier(
        n_estimators=300,
        max_depth=20,
        min_samples_split=5,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )

    model = Pipeline(
        [
            (
                "preprocessor",
                preprocessor
            ),

            (
                "classifier",
                classifier
            ),
        ]
    )

    print(
        "\nTraining Random Forest..."
    )

    model.fit(
        X_train,
        y_train
    )

    # ----------------------------------
    # Evaluation
    # ----------------------------------

    predictions = model.predict(
        X_test
    )

    probabilities = (
        model.predict_proba(
            X_test
        )[:, 1]
    )

    accuracy = accuracy_score(
        y_test,
        predictions
    )

    f1 = f1_score(
        y_test,
        predictions
    )

    roc_auc = roc_auc_score(
        y_test,
        probabilities
    )

    print(
        f"\nAccuracy: "
        f"{accuracy * 100:.2f}%"
    )

    print(
        f"F1 Score: {f1:.4f}"
    )

    print(
        f"ROC-AUC: {roc_auc:.4f}"
    )

    print(
        "\nClassification Report:\n"
    )

    print(
        classification_report(
            y_test,
            predictions,
            target_names=[
                "Not Cancelled",
                "Cancelled",
            ],
            zero_division=0,
        )
    )

    matrix = confusion_matrix(
        y_test,
        predictions
    )

    print(
        "\nConfusion Matrix:\n"
    )

    print(
        pd.DataFrame(
            matrix,
            index=[
                "Actual_Not_Cancelled",
                "Actual_Cancelled",
            ],
            columns=[
                "Predicted_Not_Cancelled",
                "Predicted_Cancelled",
            ],
        )
    )

    # ----------------------------------
    # Save
    # ----------------------------------

    joblib.dump(
        model,
        MODEL_PATH
    )

    metadata = {
        "algorithm":
            "Random Forest Classifier",

        "target":
            TARGET,

        "training_rows":
            len(X_train),

        "testing_rows":
            len(X_test),

        "accuracy":
            float(accuracy),

        "f1_score":
            float(f1),

        "roc_auc":
            float(roc_auc),

        "features":
            FEATURES,
    }

    with METADATA_PATH.open(
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            metadata,
            file,
            indent=4
        )

    print(
        f"\nModel saved: {MODEL_PATH}"
    )

    print(
        f"Metadata saved: {METADATA_PATH}"
    )


if __name__ == "__main__":
    main()