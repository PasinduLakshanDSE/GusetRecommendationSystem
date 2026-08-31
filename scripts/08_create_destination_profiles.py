from pathlib import Path

import pandas as pd


INPUT_PATH = Path(
    "data/processed/destination_reviews_clean.csv"
)

OUTPUT_PATH = Path(
    "data/processed/destination_profiles.csv"
)


# -------------------------------------------------
# Destination characteristic keywords
# -------------------------------------------------

KEYWORDS = {

    "Nature_Score": [
        "nature",
        "natural",
        "waterfall",
        "waterfalls",
        "forest",
        "mountain",
        "mountains",
        "lake",
        "river",
        "scenery",
        "scenic",
        "view",
        "views",
        "beautiful",
        "wildlife",
        "park",
        "garden",
        "beach",
        "sunrise",
        "sunset",
    ],

    "Culture_Score": [
        "temple",
        "church",
        "kovil",
        "mosque",
        "historical",
        "history",
        "heritage",
        "ancient",
        "museum",
        "monument",
        "fort",
        "fortress",
        "religious",
        "cultural",
        "culture",
        "architecture",
    ],

    "Adventure_Score": [
        "hike",
        "hiking",
        "trek",
        "trekking",
        "climb",
        "climbing",
        "adventure",
        "challenging",
        "trail",
        "rafting",
        "safari",
        "camping",
        "cycling",
        "walk",
        "walking",
    ],

    "Food_Score": [
        "food",
        "restaurant",
        "restaurants",
        "cafe",
        "cafes",
        "coffee",
        "meal",
        "dining",
        "local food",
        "delicious",
        "breakfast",
        "lunch",
        "dinner",
    ],

    "Wellness_Score": [
        "relax",
        "relaxing",
        "peaceful",
        "peace",
        "quiet",
        "calm",
        "spa",
        "wellness",
        "yoga",
        "meditation",
        "serene",
    ],

    "Entertainment_Score": [
        "entertainment",
        "music",
        "nightlife",
        "party",
        "bar",
        "pub",
        "club",
        "show",
        "festival",
        "fun",
    ],

    "Shopping_Score": [
        "shopping",
        "shop",
        "shops",
        "market",
        "markets",
        "souvenir",
        "souvenirs",
        "store",
        "stores",
    ],

    "Family_Score": [
        "family",
        "families",
        "children",
        "child",
        "kids",
        "kid",
        "safe",
        "picnic",
        "zoo",
        "playground",
    ],
}


def keyword_score(text, keywords):
    """
    Calculate the proportion of keywords appearing
    in the destination's combined reviews.
    """

    text = str(text).lower()

    matches = sum(
        1
        for keyword in keywords
        if keyword in text
    )

    return matches / len(keywords)


def normalize_column(series):
    """
    Convert scores to a 0-1 range.
    """

    minimum = series.min()
    maximum = series.max()

    if maximum == minimum:
        return series * 0

    return (
        (series - minimum)
        /
        (maximum - minimum)
    )


def main():

    data = pd.read_csv(
        INPUT_PATH
    )

    print(
        f"Loaded reviews: {len(data)}"
    )

    # -------------------------------------------------
    # Combine all reviews for each destination
    # -------------------------------------------------

    destination_data = (
        data.groupby(
            [
                "Destination",
                "District",
            ],
            as_index=False
        )
        .agg(
            Review_Count=(
                "Review",
                "count"
            ),
            Combined_Reviews=(
                "Review",
                lambda values:
                " ".join(
                    values.astype(str)
                )
            )
        )
    )

    print(
        "Destinations:",
        len(destination_data)
    )

    # -------------------------------------------------
    # Calculate characteristic scores
    # -------------------------------------------------

    for score_name, keywords in KEYWORDS.items():

        destination_data[
            score_name
        ] = destination_data[
            "Combined_Reviews"
        ].apply(
            lambda text:
            keyword_score(
                text,
                keywords
            )
        )

    # -------------------------------------------------
    # Normalize scores
    # -------------------------------------------------

    score_columns = list(
        KEYWORDS.keys()
    )

    for column in score_columns:

        destination_data[
            column
        ] = normalize_column(
            destination_data[
                column
            ]
        ).round(3)

    # -------------------------------------------------
    # Find dominant characteristic
    # -------------------------------------------------

    destination_data[
        "Primary_Category"
    ] = (
        destination_data[
            score_columns
        ]
        .idxmax(axis=1)
        .str.replace(
            "_Score",
            "",
            regex=False
        )
    )

    # -------------------------------------------------
    # Don't save huge combined review text
    # -------------------------------------------------

    output = destination_data[
        [
            "Destination",
            "District",
            "Review_Count",
            "Primary_Category",
            *score_columns,
        ]
    ]

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    output.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print(
        f"\nSaved to: {OUTPUT_PATH}"
    )

    print(
        "\nSample destination profiles:"
    )

    print(
        output.head(20).to_string(
            index=False
        )
    )

    print(
        "\nPrimary category distribution:"
    )

    print(
        output[
            "Primary_Category"
        ].value_counts()
    )


if __name__ == "__main__":
    main()