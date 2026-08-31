import pandas as pd


BUDGET_LEVELS = {
    "Low": 1,
    "Medium": 2,
    "High": 3,
    "Luxury": 4,
}


def calculate_service_context_score(
    service,
    guest_context,
):
    """
    Calculate compatibility between a hotel service
    and the guest's current context.

    Returns a score between 0 and 100.
    """

    score = 50.0

    category = str(
        service.get("Category", "")
    ).lower()

    service_budget = str(
        service.get("Min_Budget", "Low")
    )

    duration = float(
        service.get("Duration_Hours", 1)
    )

    guest_budget = guest_context.get(
        "budget",
        "Medium",
    )

    children = int(
        guest_context.get(
            "children",
            0,
        )
    )

    stay_duration = int(
        guest_context.get(
            "stay_duration",
            1,
        )
    )

    activity_level = str(
        guest_context.get(
            "activity_level",
            "Medium",
        )
    ).lower()

    # -----------------------------------
    # 1. Budget compatibility
    # -----------------------------------

    guest_budget_value = (
        BUDGET_LEVELS.get(
            guest_budget,
            2,
        )
    )

    service_budget_value = (
        BUDGET_LEVELS.get(
            service_budget,
            1,
        )
    )

    if (
        service_budget_value
        <= guest_budget_value
    ):
        score += 15

    else:
        difference = (
            service_budget_value
            - guest_budget_value
        )

        score -= 15 * difference

    # -----------------------------------
    # 2. Family context
    # -----------------------------------

    if children > 0:

        if category == "family":
            score += 20

        if category in {
            "adventure",
        }:
            score -= 5

    else:

        if category == "family":
            score -= 5

    # -----------------------------------
    # 3. Activity-level compatibility
    # -----------------------------------

    if activity_level == "high":

        if category in {
            "adventure",
            "nature",
        }:
            score += 15

    elif activity_level == "low":

        if category == "adventure":
            score -= 15

        if category in {
            "wellness",
            "culture",
        }:
            score += 10

    # -----------------------------------
    # 4. Stay duration
    # -----------------------------------

    if stay_duration <= 2:

        # Long activities are less convenient
        # for very short stays.
        if duration > 4:
            score -= 10

    elif stay_duration >= 5:

        if duration >= 3:
            score += 5

    # Keep 0-100
    return round(
        max(
            0,
            min(100, score)
        ),
        2,
    )


def rerank_services(
    services,
    guest_context,
):
    """
    Combine preference similarity and contextual
    compatibility.

    Final score:
        70% preference similarity
        30% context compatibility
    """

    result = services.copy()

    context_scores = []

    for _, service in result.iterrows():

        context_score = (
            calculate_service_context_score(
                service,
                guest_context,
            )
        )

        context_scores.append(
            context_score
        )

    result[
        "Context_Score"
    ] = context_scores

    result[
        "Hybrid_Score"
    ] = (
        (
            result[
                "Match_Percentage"
            ]
            * 0.70
        )
        +
        (
            result[
                "Context_Score"
            ]
            * 0.30
        )
    ).round(2)

    result = (
        result
        .sort_values(
            "Hybrid_Score",
            ascending=False,
        )
        .reset_index(
            drop=True
        )
    )

    return result