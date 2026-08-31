from pathlib import Path
import re

import joblib
import pandas as pd


DATA_PATH = Path(
    "data/processed/hotel_reviews_nlp.csv"
)

MODEL_PATH = Path(
    "models/hotel_sentiment_model.joblib"
)

OUTPUT_PATH = Path(
    "data/processed/hotel_aspect_intelligence.csv"
)


# --------------------------------------------------
# Hospitality aspects
# --------------------------------------------------

ASPECTS = {

    "Room": [
        "room",
        "bed",
        "bedroom",
        "suite",
        "bathroom",
        "shower",
    ],

    "Food": [
        "food",
        "breakfast",
        "lunch",
        "dinner",
        "restaurant",
        "meal",
        "buffet",
    ],

    "Staff_Service": [
        "staff",
        "service",
        "reception",
        "manager",
        "employee",
        "waiter",
    ],

    "Cleanliness": [
        "clean",
        "cleanliness",
        "dirty",
        "dust",
        "hygiene",
    ],

    "Location": [
        "location",
        "area",
        "near",
        "distance",
        "central",
        "station",
    ],

    "Wellness": [
        "spa",
        "massage",
        "wellness",
        "gym",
        "pool",
        "sauna",
        "relax",
    ],

    "Facilities": [
        "facility",
        "facilities",
        "wifi",
        "internet",
        "parking",
        "elevator",
        "lift",
        "air conditioning",
    ],

    "Value": [
        "price",
        "expensive",
        "cheap",
        "value",
        "money",
        "cost",
    ],
}


def contains_aspect(text, keywords):

    text = str(text).lower()

    for keyword in keywords:

        pattern = (
            r"\b"
            + re.escape(keyword)
            + r"\b"
        )

        if re.search(pattern, text):
            return True

    return False


def main():

    print(
        "Loading review intelligence data..."
    )

    data = pd.read_csv(
        DATA_PATH,
        usecols=[
            "Hotel_Name",
            "Combined_Review",
        ]
    )

    data = data.dropna()

    print(
        f"Reviews loaded: {len(data):,}"
    )

    model = joblib.load(
        MODEL_PATH
    )

    # ------------------------------------------------
    # Predict overall review sentiment
    # ------------------------------------------------

    print(
        "\nPredicting sentiment..."
    )

    data["Predicted_Sentiment"] = (
        model.predict(
            data["Combined_Review"]
        )
    )

    # ------------------------------------------------
    # Detect aspects
    # ------------------------------------------------

    print(
        "Detecting hospitality aspects..."
    )

    for aspect, keywords in ASPECTS.items():

        data[aspect] = (
            data["Combined_Review"]
            .apply(
                lambda text:
                contains_aspect(
                    text,
                    keywords
                )
            )
        )

    # ------------------------------------------------
    # Convert to long format
    # ------------------------------------------------

    records = []

    for aspect in ASPECTS:

        subset = data[
            data[aspect]
        ]

        for sentiment in [
            "Positive",
            "Neutral",
            "Negative",
        ]:

            counts = (
                subset[
                    subset[
                        "Predicted_Sentiment"
                    ]
                    == sentiment
                ]
                .groupby(
                    "Hotel_Name"
                )
                .size()
            )

            for hotel, count in counts.items():

                records.append(
                    {
                        "Hotel_Name": hotel,
                        "Aspect": aspect,
                        "Sentiment": sentiment,
                        "Count": int(count),
                    }
                )

    aspect_data = pd.DataFrame(
        records
    )

    if aspect_data.empty:

        print(
            "No aspect information found."
        )

        return

    # ------------------------------------------------
    # Pivot sentiment counts
    # ------------------------------------------------

    pivot = (
        aspect_data
        .pivot_table(
            index=[
                "Hotel_Name",
                "Aspect",
            ],
            columns="Sentiment",
            values="Count",
            aggfunc="sum",
            fill_value=0,
        )
        .reset_index()
    )

    for column in [
        "Positive",
        "Neutral",
        "Negative",
    ]:

        if column not in pivot.columns:
            pivot[column] = 0

    pivot["Total"] = (
        pivot["Positive"]
        + pivot["Neutral"]
        + pivot["Negative"]
    )

    # ------------------------------------------------
    # Positive percentage
    # ------------------------------------------------

    pivot[
        "Positive_Percentage"
    ] = (
        pivot["Positive"]
        /
        pivot["Total"]
        * 100
    ).round(2)

    # ------------------------------------------------
    # Negative percentage
    # ------------------------------------------------

    pivot[
        "Negative_Percentage"
    ] = (
        pivot["Negative"]
        /
        pivot["Total"]
        * 100
    ).round(2)

    # ------------------------------------------------
    # Sentiment score
    #
    # Positive = +1
    # Neutral  = 0
    # Negative = -1
    # ------------------------------------------------

    pivot[
        "Sentiment_Score"
    ] = (
        (
            pivot["Positive"]
            - pivot["Negative"]
        )
        /
        pivot["Total"]
    ).round(3)

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    pivot.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print(
        f"\nHotel/aspect combinations: "
        f"{len(pivot):,}"
    )

    print(
        f"\nSaved to: {OUTPUT_PATH}"
    )

    print(
        "\nSample aspect intelligence:\n"
    )

    print(
        pivot.head(30)
        .to_string(index=False)
    )

    print(
        "\nOverall aspect summary:\n"
    )

    summary = (
        pivot.groupby("Aspect")
        .agg(
            Hotels=("Hotel_Name", "nunique"),
            Average_Positive=(
                "Positive_Percentage",
                "mean"
            ),
            Average_Negative=(
                "Negative_Percentage",
                "mean"
            ),
            Average_Sentiment=(
                "Sentiment_Score",
                "mean"
            ),
        )
        .round(2)
        .sort_values(
            "Average_Sentiment",
            ascending=False
        )
    )

    print(summary)


if __name__ == "__main__":
    main()