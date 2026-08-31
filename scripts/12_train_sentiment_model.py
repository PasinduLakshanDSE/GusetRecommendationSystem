from pathlib import Path
import json

import joblib
import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


DATA_PATH = Path(
    "data/processed/hotel_reviews_nlp.csv"
)

MODEL_PATH = Path(
    "models/hotel_sentiment_model.joblib"
)

METADATA_PATH = Path(
    "models/hotel_sentiment_metadata.json"
)

MODEL_PATH.parent.mkdir(
    parents=True,
    exist_ok=True
)


def main():

    print("Loading cleaned reviews...")

    data = pd.read_csv(
        DATA_PATH,
        usecols=[
            "Combined_Review",
            "Sentiment",
        ]
    )

    data = data.dropna()

    print(
        f"Available reviews: {len(data):,}"
    )

    print("\nClass distribution:")
    print(
        data["Sentiment"].value_counts()
    )

    X = data["Combined_Review"]
    y = data["Sentiment"]

    # -----------------------------------
    # 80 / 20 split
    # -----------------------------------

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
        f"\nTraining reviews: {len(X_train):,}"
    )

    print(
        f"Testing reviews: {len(X_test):,}"
    )

    # -----------------------------------
    # NLP pipeline
    # -----------------------------------

    model = Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    max_features=40000,
                    ngram_range=(1, 2),
                    min_df=3,
                    max_df=0.95,
                    sublinear_tf=True,
                ),
            ),

            (
                "classifier",
                LogisticRegression(
                    max_iter=1000,
                    class_weight="balanced",
                    solver="lbfgs",
                    random_state=42,
                ),
            ),
        ]
    )

    print(
        "\nTraining TF-IDF + "
        "Logistic Regression..."
    )

    model.fit(
        X_train,
        y_train
    )

    # -----------------------------------
    # Evaluation
    # -----------------------------------

    predictions = model.predict(
        X_test
    )

    accuracy = accuracy_score(
        y_test,
        predictions
    )

    macro_f1 = f1_score(
        y_test,
        predictions,
        average="macro"
    )

    weighted_f1 = f1_score(
        y_test,
        predictions,
        average="weighted"
    )

    print(
        f"\nAccuracy: "
        f"{accuracy * 100:.2f}%"
    )

    print(
        f"Macro F1: "
        f"{macro_f1:.4f}"
    )

    print(
        f"Weighted F1: "
        f"{weighted_f1:.4f}"
    )

    print(
        "\nClassification Report:\n"
    )

    print(
        classification_report(
            y_test,
            predictions,
            zero_division=0,
        )
    )

    print(
        "\nConfusion Matrix:\n"
    )

    labels = [
        "Negative",
        "Neutral",
        "Positive",
    ]

    matrix = confusion_matrix(
        y_test,
        predictions,
        labels=labels,
    )

    print(
        pd.DataFrame(
            matrix,
            index=[
                f"Actual_{x}"
                for x in labels
            ],
            columns=[
                f"Predicted_{x}"
                for x in labels
            ],
        )
    )

    # -----------------------------------
    # Save model
    # -----------------------------------

    joblib.dump(
        model,
        MODEL_PATH
    )

    metadata = {
        "algorithm":
            "TF-IDF + Logistic Regression",

        "training_rows":
            len(X_train),

        "testing_rows":
            len(X_test),

        "accuracy":
            float(accuracy),

        "macro_f1":
            float(macro_f1),

        "weighted_f1":
            float(weighted_f1),

        "classes":
            labels,
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
