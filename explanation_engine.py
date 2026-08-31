BUDGET_LEVELS = {
    "Low": 1,
    "Medium": 2,
    "High": 3,
    "Luxury": 4,
}


def clean_category(category):
    return str(category).strip().lower()


def preference_key_for_category(category):
    """
    Convert a service/place category into
    the corresponding guest preference key.
    """

    mapping = {
        "nature": "Nature_Interest",
        "culture": "Culture_Interest",
        "adventure": "Adventure_Interest",
        "food": "Food_Interest",
        "wellness": "Wellness_Interest",
        "entertainment": "Entertainment_Interest",
        "shopping": "Shopping_Interest",
        "family": "Family_Interest",
    }

    return mapping.get(
        clean_category(category)
    )


def preference_description(
    category,
    guest_preferences,
):
    key = preference_key_for_category(
        category
    )

    if not key:
        return None

    value = float(
        guest_preferences.get(
            key,
            0
        )
    )

    category_name = str(
        category
    ).title()

    if value >= 0.80:
        return (
            f"Strong match with your "
            f"{category_name} preference."
        )

    if value >= 0.60:
        return (
            f"Good match with your "
            f"{category_name} preference."
        )

    if value >= 0.40:
        return (
            f"Moderate match with your "
            f"{category_name} preference."
        )

    return None


# --------------------------------------------------
# Service explanations
# --------------------------------------------------

def explain_service(
    service,
    guest_preferences,
    guest_context,
):

    reasons = []

    category = clean_category(
        service.get(
            "Category",
            ""
        )
    )

    preference_reason = (
        preference_description(
            category,
            guest_preferences,
        )
    )

    if preference_reason:
        reasons.append(
            preference_reason
        )

    # ----------------------------------
    # Activity level
    # ----------------------------------

    activity_level = str(
        guest_context.get(
            "activity_level",
            "Medium"
        )
    ).lower()

    if (
        activity_level == "high"
        and
        category in {
            "adventure",
            "nature",
        }
    ):
        reasons.append(
            "Suitable for your high "
            "activity level."
        )

    elif (
        activity_level == "low"
        and
        category in {
            "culture",
            "wellness",
        }
    ):
        reasons.append(
            "Suitable for a relaxed "
            "activity preference."
        )

    # ----------------------------------
    # Family
    # ----------------------------------

    children = int(
        guest_context.get(
            "children",
            0
        )
    )

    if (
        children > 0
        and
        category == "family"
    ):
        reasons.append(
            "Suitable for a stay "
            "with children."
        )

    # ----------------------------------
    # Budget
    # ----------------------------------

    guest_budget = str(
        guest_context.get(
            "budget",
            "Medium"
        )
    )

    service_budget = str(
        service.get(
            "Min_Budget",
            "Low"
        )
    )

    guest_budget_level = (
        BUDGET_LEVELS.get(
            guest_budget,
            2
        )
    )

    service_budget_level = (
        BUDGET_LEVELS.get(
            service_budget,
            1
        )
    )

    if (
        service_budget_level
        <= guest_budget_level
    ):
        reasons.append(
            f"Fits within your "
            f"{guest_budget} budget level."
        )

    # ----------------------------------
    # Stay duration
    # ----------------------------------

    stay_duration = int(
        guest_context.get(
            "stay_duration",
            1
        )
    )

    duration = float(
        service.get(
            "Duration_Hours",
            0
        )
    )

    if (
        stay_duration <= 2
        and
        duration <= 4
    ):
        reasons.append(
            "Practical for your "
            "short stay."
        )

    elif stay_duration >= 4:
        reasons.append(
            f"Suitable for your "
            f"{stay_duration}-night stay."
        )

    # ----------------------------------
    # Score evidence
    # ----------------------------------

    hybrid_score = float(
        service.get(
            "Hybrid_Score",
            0
        )
    )

    if hybrid_score >= 80:
        reasons.append(
            "Received a high combined "
            "preference and context score."
        )

    return reasons[:5]


# --------------------------------------------------
# Place explanations
# --------------------------------------------------

def explain_place(
    place,
    guest_preferences,
    guest_context,
):

    reasons = []

    category = clean_category(
        place.get(
            "Primary_Category",
            ""
        )
    )

    preference_reason = (
        preference_description(
            category,
            guest_preferences,
        )
    )

    if preference_reason:
        reasons.append(
            preference_reason
        )

    # ----------------------------------
    # District
    # ----------------------------------

    guest_district = str(
        guest_context.get(
            "district",
            ""
        ) or ""
    ).strip()

    place_district = str(
        place.get(
            "District",
            ""
        )
    ).strip()

    if (
        guest_district
        and
        guest_district.lower()
        ==
        place_district.lower()
    ):
        reasons.append(
            f"Located in your selected "
            f"{place_district} district."
        )

    # ----------------------------------
    # Activity
    # ----------------------------------

    activity_level = str(
        guest_context.get(
            "activity_level",
            "Medium"
        )
    ).lower()

    if (
        activity_level == "high"
        and
        category == "adventure"
    ):
        reasons.append(
            "Strong fit for your high "
            "activity level."
        )

    elif (
        activity_level == "high"
        and
        category == "nature"
    ):
        reasons.append(
            "Suitable for an active "
            "nature-focused trip."
        )

    elif (
        activity_level == "low"
        and
        category in {
            "wellness",
            "culture",
        }
    ):
        reasons.append(
            "Suitable for your relaxed "
            "activity preference."
        )

    # ----------------------------------
    # Family
    # ----------------------------------

    children = int(
        guest_context.get(
            "children",
            0
        )
    )

    if (
        children > 0
        and
        category == "family"
    ):
        reasons.append(
            "Relevant to your family "
            "travel context."
        )

    # ----------------------------------
    # Review evidence
    # ----------------------------------

    review_count = int(
        place.get(
            "Review_Count",
            0
        )
    )

    if review_count >= 500:

        reasons.append(
            f"Supported by strong review "
            f"evidence ({review_count:,} reviews)."
        )

    elif review_count >= 100:

        reasons.append(
            f"Supported by {review_count:,} "
            f"destination reviews."
        )

    # ----------------------------------
    # Hybrid score
    # ----------------------------------

    hybrid_score = float(
        place.get(
            "Hybrid_Score",
            0
        )
    )

    if hybrid_score >= 85:
        reasons.append(
            "Received a very high combined "
            "preference and context score."
        )

    return reasons[:5]