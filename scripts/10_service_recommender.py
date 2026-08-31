from pathlib import Path

import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity


DATA_PATH = Path(
    "data/raw/hotel_Service/hotel_services.csv"
)


SERVICE_FEATURES = [
    "Nature",
    "Culture",
    "Adventure",
    "Food",
    "Wellness",
    "Entertainment",
    "Shopping",
    "Family",
]


BUDGET_LEVEL = {
    "Low": 1,
    "Medium": 2,
    "High": 3,
    "Luxury": 4,
}


def recommend_services(
    guest_preferences,
    guest_budget,
    top_n=5,
):

    services = pd.read_csv(DATA_PATH)

    guest_vector = [[
        guest_preferences["Nature_Interest"],
        guest_preferences["Culture_Interest"],
        guest_preferences["Adventure_Interest"],
        guest_preferences["Food_Interest"],
        guest_preferences["Wellness_Interest"],
        guest_preferences["Entertainment_Interest"],
        guest_preferences["Shopping_Interest"],
        guest_preferences["Family_Interest"],
    ]]

    service_vectors = services[
        SERVICE_FEATURES
    ].values

    similarities = cosine_similarity(
        guest_vector,
        service_vectors
    )[0]

    services["Preference_Score"] = similarities

    # -----------------------------------------
    # Budget compatibility
    # -----------------------------------------

    guest_budget_level = BUDGET_LEVEL.get(
        guest_budget,
        2
    )

    def budget_score(service_budget):

        service_level = BUDGET_LEVEL.get(
            service_budget,
            2
        )

        difference = abs(
            guest_budget_level -
            service_level
        )

        if difference == 0:
            return 1.0

        if difference == 1:
            return 0.7

        if difference == 2:
            return 0.3

        return 0.1

    services["Budget_Score"] = (
        services["Min_Budget"]
        .apply(budget_score)
    )

    # -----------------------------------------
    # Initial hybrid service score
    # -----------------------------------------

    services["Final_Score"] = (
        0.85
        * services["Preference_Score"]
        +
        0.15
        * services["Budget_Score"]
    )

    services["Match_Percentage"] = (
        services["Final_Score"]
        * 100
    ).round(2)

    results = (
        services
        .sort_values(
            "Final_Score",
            ascending=False
        )
        .head(top_n)
    )

    return results[
        [
            "Service_ID",
            "Service_Name",
            "Category",
            "Min_Budget",
            "Duration_Hours",
            "Match_Percentage",
        ]
    ]


def main():

    # Same nature/adventure-oriented guest
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

    results = recommend_services(
        guest_preferences=guest,
        guest_budget="Medium",
        top_n=5,
    )

    print(
        "\nTOP PERSONALIZED HOTEL SERVICES\n"
    )

    print(
        results.to_string(
            index=False
        )
    )


if __name__ == "__main__":
    main()
