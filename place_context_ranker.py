import math


def calculate_place_context_score(
    place,
    guest_context,
):
    """
    Calculate contextual compatibility
    for a tourist destination.

    Returns 0-100.
    """

    score = 50.0

    category = str(
        place.get(
            "Primary_Category",
            ""
        )
    ).lower()

    place_district = str(
        place.get(
            "District",
            ""
        )
    ).strip().lower()

    guest_district = str(
        guest_context.get(
            "district",
            ""
        ) or ""
    ).strip().lower()

    children = int(
        guest_context.get(
            "children",
            0
        )
    )

    stay_duration = int(
        guest_context.get(
            "stay_duration",
            1
        )
    )

    activity_level = str(
        guest_context.get(
            "activity_level",
            "Medium"
        )
    ).lower()

    review_count = float(
        place.get(
            "Review_Count",
            0
        )
    )

    # ---------------------------------
    # 1. District relevance
    # ---------------------------------

    if guest_district:

        if place_district == guest_district:
            score += 20

        else:
            # We don't know actual geographic
            # distance yet, so don't strongly
            # penalize another district.
            score -= 3

    # ---------------------------------
    # 2. Family context
    # ---------------------------------

    if children > 0:

        if category == "family":
            score += 20

        elif category == "adventure":
            score -= 8

        elif category in {
            "nature",
            "culture",
        }:
            score += 5

    # ---------------------------------
    # 3. Activity level
    # ---------------------------------

    if activity_level == "high":

        if category == "adventure":
            score += 18

        elif category == "nature":
            score += 10

    elif activity_level == "medium":

        if category in {
            "nature",
            "culture",
            "wellness",
        }:
            score += 6

    elif activity_level == "low":

        if category == "adventure":
            score -= 18

        elif category in {
            "culture",
            "wellness",
        }:
            score += 12

    # ---------------------------------
    # 4. Stay duration
    # ---------------------------------

    if stay_duration <= 2:

        # Without real travel-distance data,
        # only give a small same-district bonus.
        if (
            guest_district
            and
            place_district == guest_district
        ):
            score += 10

    elif stay_duration >= 5:

        # Longer stays allow broader exploration.
        score += 5

    # ---------------------------------
    # 5. Review/popularity evidence
    # ---------------------------------
    # Small bonus only.
    #
    # log1p prevents destinations with huge
    # review counts from dominating ranking.
    # ---------------------------------

    popularity_bonus = min(
        10,
        math.log1p(
            max(review_count, 0)
        )
    )

    score += popularity_bonus

    return round(
        max(
            0,
            min(100, score)
        ),
        2
    )


def rerank_places(
    places,
    guest_context,
):

    result = places.copy()

    context_scores = []

    for _, place in result.iterrows():

        context_score = (
            calculate_place_context_score(
                place,
                guest_context
            )
        )

        context_scores.append(
            context_score
        )

    result[
        "Context_Score"
    ] = context_scores

    # ---------------------------------
    # Hybrid destination score
    #
    # 75% preference similarity
    # 25% contextual compatibility
    # ---------------------------------

    result[
        "Hybrid_Score"
    ] = (
        result[
            "Match_Percentage"
        ] * 0.75
        +
        result[
            "Context_Score"
        ] * 0.25
    ).round(2)

    result = (
        result
        .sort_values(
            "Hybrid_Score",
            ascending=False
        )
        .reset_index(
            drop=True
        )
    )

    return result