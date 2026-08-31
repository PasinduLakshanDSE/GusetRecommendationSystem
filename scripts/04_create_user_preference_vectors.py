from pathlib import Path
import pandas as pd


INPUT_PATH = Path(
    "data/processed/users_clean.csv"
)

OUTPUT_PATH = Path(
    "data/processed/user_preference_vectors.csv"
)


# --------------------------------------------------
# Preference mapping
# --------------------------------------------------

PREFERENCE_MAPPING = {

    "nature": [
        "beach",
        "beaches",
        "nature",
        "park",
        "parks",
        "garden",
        "gardens",
        "viewpoint",
        "viewpoints",
        "scenic",
        "waterfall",
        "mountain",
        "hiking",
    ],

    "culture": [
        "historical",
        "history",
        "culture",
        "cultural",
        "church",
        "churches",
        "museum",
        "museums",
        "monument",
        "monuments",
        "art",
        "heritage",
        "temple",
    ],

    # NEW
    "adventure": [
        "adventure",
        "adventures",
        "hiking",
        "trekking",
        "climbing",
        "camping",
        "rafting",
        "diving",
        "surfing",
        "zipline",
        "ziplining",
        "safari",
        "cycling",
        "mountain",
        "waterfall",
    ],

    "food": [
        "food",
        "restaurant",
        "restaurants",
        "cafe",
        "cafes",
        "bakery",
        "bakeries",
        "pizza",
        "burger",
        "juice",
        "dining",
        "culinary",
    ],

    "wellness": [
        "spa",
        "spas",
        "wellness",
        "gym",
        "gyms",
        "swimming",
        "pool",
        "pools",
        "resort",
        "resorts",
        "yoga",
        "massage",
    ],

    "entertainment": [
        "entertainment",
        "theatre",
        "theatres",
        "bar",
        "bars",
        "pub",
        "pubs",
        "dance",
        "club",
        "clubs",
        "nightlife",
    ],

    "shopping": [
        "shopping",
        "mall",
        "malls",
        "market",
        "markets",
        "shops",
    ],

    "family": [
        "family",
        "kids",
        "children",
        "zoo",
        "zoos",
        "park",
        "parks",
        "garden",
        "gardens",
    ],
}


# --------------------------------------------------
# Eight K-Means preference dimensions
# --------------------------------------------------

FEATURE_COLUMNS = [
    "Nature_Interest",
    "Culture_Interest",
    "Adventure_Interest",
    "Food_Interest",
    "Wellness_Interest",
    "Entertainment_Interest",
    "Shopping_Interest",
    "Family_Interest",
]


# --------------------------------------------------
# Calculate interest score
# --------------------------------------------------

def calculate_interest(
    preference_text,
    keywords
):
    text = str(
        preference_text
    ).lower()

    matches = sum(
        keyword in text
        for keyword in keywords
    )

    if matches == 0:
        return 1.0

    if matches == 1:
        return 3.0

    if matches == 2:
        return 4.0

    return 5.0


# --------------------------------------------------
# Main
# --------------------------------------------------

def main():

    data = pd.read_csv(
        INPUT_PATH
    )

    print(
        f"Loaded users: {len(data)}"
    )

    # --------------------------------------------------
    # Create eight preference dimensions
    # --------------------------------------------------

    for feature in FEATURE_COLUMNS:

        # Convert:
        #
        # Nature_Interest
        #
        # into:
        #
        # nature

        preference_category = (
            feature
            .replace(
                "_Interest",
                ""
            )
            .lower()
        )

        data[feature] = (
            data["Preferences"].apply(
                lambda value:
                calculate_interest(
                    value,
                    PREFERENCE_MAPPING[
                        preference_category
                    ]
                )
            )
        )

    # --------------------------------------------------
    # Save
    # --------------------------------------------------

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    data.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print(
        "\nPreference vectors created."
    )

    print(
        "\nColumns:"
    )

    print(
        data.columns.tolist()
    )

    print(
        "\nSample preference vectors:"
    )

    print(
        data[
            [
                "UserID",
                "Preferences",
                *FEATURE_COLUMNS,
            ]
        ].head(10).to_string(
            index=False
        )
    )

    print(
        f"\nSaved to: {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()