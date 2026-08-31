from pathlib import Path

import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity


DATA_PATH = Path(
    "data/processed/destination_profiles.csv"
)


DESTINATION_FEATURES = [
    "Nature_Score",
    "Culture_Score",
    "Adventure_Score",
    "Food_Score",
    "Wellness_Score",
    "Entertainment_Score",
    "Shopping_Score",
    "Family_Score",
]


def recommend_places(
    guest_preferences,
    top_n=10,
    district=None,
):

    data = pd.read_csv(
        DATA_PATH
    )

    # Optional location filter
    if district:

        filtered = data[
            data["District"]
            .str.lower()
            ==
            district.lower()
        ].copy()

        if not filtered.empty:
            data = filtered

    guest_vector = [[
        guest_preferences[
            "Nature_Interest"
        ],
        guest_preferences[
            "Culture_Interest"
        ],
        guest_preferences[
            "Adventure_Interest"
        ],
        guest_preferences[
            "Food_Interest"
        ],
        guest_preferences[
            "Wellness_Interest"
        ],
        guest_preferences[
            "Entertainment_Interest"
        ],
        guest_preferences[
            "Shopping_Interest"
        ],
        guest_preferences[
            "Family_Interest"
        ],
    ]]

    destination_vectors = data[
        DESTINATION_FEATURES
    ].values

    similarity = cosine_similarity(
        guest_vector,
        destination_vectors
    )[0]

    data["Similarity"] = similarity

    # Small reliability factor based on number of reviews.
    max_reviews = max(
        data["Review_Count"].max(),
        1
    )

    data["Review_Reliability"] = (
        data["Review_Count"]
        /
        max_reviews
    )

    # First experimental ranking formula.
    data["Final_Score"] = (
        0.90
        *
        data["Similarity"]
        +
        0.10
        *
        data["Review_Reliability"]
    )

    recommendations = (
        data.sort_values(
            "Final_Score",
            ascending=False
        )
        .head(top_n)
        .copy()
    )

    recommendations[
        "Match_Percentage"
    ] = (
        recommendations[
            "Final_Score"
        ]
        * 100
    ).round(2)

    return recommendations[
        [
            "Destination",
            "District",
            "Primary_Category",
            "Review_Count",
            "Match_Percentage",
        ]
    ]


def main():

    # Test Adventure/Nature guest
    guest = {

        "Nature_Interest": 0.95,
        "Culture_Interest": 0.40,
        "Adventure_Interest": 0.90,
        "Food_Interest": 0.25,
        "Wellness_Interest": 0.35,
        "Entertainment_Interest": 0.20,
        "Shopping_Interest": 0.10,
        "Family_Interest": 0.30,
    }

    recommendations = recommend_places(
        guest,
        top_n=10
    )

    print(
        "\nTOP PERSONALIZED PLACES\n"
    )

    print(
        recommendations.to_string(
            index=False
        )
    )


if __name__ == "__main__":
    main()