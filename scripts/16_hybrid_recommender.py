from pathlib import Path
import sys

import joblib
import pandas as pd


# ============================================================
# PROJECT PATH
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


# ============================================================
# IMPORT PROJECT MODULES
# ============================================================

from context_ranker import rerank_services
from place_context_ranker import rerank_places

from explanation_engine import (
    explain_service,
    explain_place,
)

from scripts_compat import (
    load_service_recommendations,
    load_place_recommendations,
)


# ============================================================
# MODEL PATHS
# ============================================================

KMEANS_MODEL_PATH = (
    PROJECT_ROOT
    / "models"
    / "kmeans_guest_segments.joblib"
)

KMEANS_SCALER_PATH = (
    PROJECT_ROOT
    / "models"
    / "guest_segment_scaler.joblib"
)

BOOKING_MODEL_PATH = (
    PROJECT_ROOT
    / "models"
    / "booking_cancellation_model.joblib"
)


# ============================================================
# K-MEANS FEATURES
# ============================================================

SEGMENT_FEATURES = [
    "Nature_Interest",
    "Culture_Interest",
    "Food_Interest",
    "Wellness_Interest",
    "Entertainment_Interest",
    "Shopping_Interest",
    "Family_Interest",
]


# ============================================================
# GUEST SEGMENT NAMES
# ============================================================

SEGMENT_NAMES = {
    0: "Nature & Wellness Explorer",
    1: "Family Entertainment Explorer",
    2: "Shopping & Food Explorer",
}


# ============================================================
# LOAD MODELS ONCE
# ============================================================

print("Loading AI models...")

kmeans_model = joblib.load(
    KMEANS_MODEL_PATH
)

kmeans_scaler = joblib.load(
    KMEANS_SCALER_PATH
)

booking_model = joblib.load(
    BOOKING_MODEL_PATH
)

print("AI models loaded successfully.")


# ============================================================
# 1. PREDICT GUEST SEGMENT
# ============================================================

def predict_guest_segment(
    guest_preferences,
):
    """
    Predict the guest's preference segment
    using the trained K-Means model.
    """

    frame = pd.DataFrame(
        [
            {
                feature:
                    guest_preferences[feature]
                for feature in SEGMENT_FEATURES
            }
        ]
    )

    # Scale guest preference values.
    scaled = kmeans_scaler.transform(
        frame
    )

    # Predict cluster.
    cluster = int(
        kmeans_model.predict(
            scaled
        )[0]
    )

    segment_name = SEGMENT_NAMES.get(
        cluster,
        f"Cluster {cluster}",
    )

    return {
        "cluster": cluster,
        "segment": segment_name,
    }


# ============================================================
# 2. PREDICT BOOKING CANCELLATION RISK
# ============================================================

def predict_booking_risk(
    booking_context,
):
    """
    Predict booking cancellation probability
    using the trained Random Forest model.
    """

    booking_frame = pd.DataFrame(
        [booking_context]
    )

    probability = float(
        booking_model.predict_proba(
            booking_frame
        )[0][1]
    )

    # Convert probability into risk level.
    if probability < 0.30:
        level = "Low"

    elif probability < 0.60:
        level = "Medium"

    else:
        level = "High"

    return {
        "probability": round(
            probability * 100,
            2,
        ),
        "level": level,
    }


# ============================================================
# 3. CREATE OVERALL GUEST EXPLANATION
# ============================================================

def create_explanation(
    guest_preferences,
    segment,
):
    """
    Generate a human-readable explanation
    of the guest's preference profile.
    """

    sorted_preferences = sorted(
        guest_preferences.items(),
        key=lambda item: item[1],
        reverse=True,
    )

    top_preferences = (
        sorted_preferences[:3]
    )

    explanations = [
        (
            f"Guest belongs to the "
            f"'{segment}' preference segment."
        )
    ]

    for feature, score in top_preferences:

        label = (
            feature
            .replace(
                "_Interest",
                "",
            )
            .replace(
                "_",
                " ",
            )
        )

        explanations.append(
            (
                f"Strong "
                f"{label.lower()} "
                f"preference "
                f"({score:.2f})."
            )
        )

    return explanations


# ============================================================
# 4. ADD SERVICE EXPLANATIONS
# ============================================================

def add_service_explanations(
    services,
    guest_preferences,
    guest_context,
):
    """
    Add human-readable explanations
    to each recommended hotel service.
    """

    services = services.copy()

    services[
        "Why_Recommended"
    ] = services.apply(
        lambda service:
            explain_service(
                service,
                guest_preferences,
                guest_context,
            ),
        axis=1,
    )

    return services


# ============================================================
# 5. ADD PLACE EXPLANATIONS
# ============================================================

def add_place_explanations(
    places,
    guest_preferences,
    guest_context,
):
    """
    Add human-readable explanations
    to each recommended destination.
    """

    places = places.copy()

    places[
        "Why_Recommended"
    ] = places.apply(
        lambda place:
            explain_place(
                place,
                guest_preferences,
                guest_context,
            ),
        axis=1,
    )

    return places


# ============================================================
# 6. FINAL HYBRID RECOMMENDATION ENGINE
# ============================================================

def generate_hybrid_recommendation(
    guest_preferences,
    guest_context,
    booking_context,
):

    # ========================================================
    # STEP 1 — K-MEANS GUEST SEGMENTATION
    # ========================================================

    segment_result = (
        predict_guest_segment(
            guest_preferences
        )
    )


    # ========================================================
    # STEP 2 — HOTEL SERVICE RECOMMENDATION
    # ========================================================

    # Get more candidates first.
    service_candidates = (
        load_service_recommendations(
            guest_preferences,
            guest_context["budget"],
            top_n=10,
        )
    )

    # Re-rank candidates using context.
    services = rerank_services(
        service_candidates,
        guest_context,
    )

    # Keep top 5.
    services = services.head(
        5
    ).copy()


    # Add explanations.
    services = add_service_explanations(
        services,
        guest_preferences,
        guest_context,
    )


    # ========================================================
    # STEP 3 — DESTINATION RECOMMENDATION
    # ========================================================

    # Get a larger candidate pool.
    place_candidates = (
        load_place_recommendations(
            guest_preferences,
            top_n=20,
            district=None,
        )
    )

    # Context-aware re-ranking.
    places = rerank_places(
        place_candidates,
        guest_context,
    )

    # Keep top 5.
    places = places.head(
        5
    ).copy()


    # Add explanations.
    places = add_place_explanations(
        places,
        guest_preferences,
        guest_context,
    )


    # ========================================================
    # STEP 4 — BOOKING CANCELLATION RISK
    # ========================================================

    booking_risk = (
        predict_booking_risk(
            booking_context
        )
    )


    # ========================================================
    # STEP 5 — OVERALL EXPLANATION
    # ========================================================

    explanation = (
        create_explanation(
            guest_preferences,
            segment_result["segment"],
        )
    )


    # ========================================================
    # FINAL RESULT
    # ========================================================

    return {

        "guest_segment":
            segment_result,

        "booking_risk":
            booking_risk,

        "recommended_services":
            services,

        "recommended_places":
            places,

        "explanation":
            explanation,
    }


# ============================================================
# DISPLAY SERVICE RESULTS
# ============================================================

def print_services(
    services,
):

    print(
        "\n"
        + "=" * 60
    )

    print(
        "RECOMMENDED HOTEL SERVICES"
    )

    print(
        "=" * 60
    )

    for number, (
        index,
        service,
    ) in enumerate(
        services.iterrows(),
        start=1,
    ):

        print(
            f"\n{number}. "
            f"{service['Service_Name']}"
        )

        print(
            f"   Service ID: "
            f"{service['Service_ID']}"
        )

        print(
            f"   Category: "
            f"{service['Category']}"
        )

        print(
            f"   Budget: "
            f"{service['Min_Budget']}"
        )

        print(
            f"   Duration: "
            f"{service['Duration_Hours']} hours"
        )

        print(
            f"   Preference Match: "
            f"{service['Match_Percentage']:.2f}%"
        )

        print(
            f"   Context Score: "
            f"{service['Context_Score']:.2f}%"
        )

        print(
            f"   Hybrid Score: "
            f"{service['Hybrid_Score']:.2f}%"
        )

        print(
            "   Why recommended:"
        )

        reasons = service[
            "Why_Recommended"
        ]

        for reason in reasons:

            print(
                f"      ✓ {reason}"
            )


# ============================================================
# DISPLAY PLACE RESULTS
# ============================================================

def print_places(
    places,
):

    print(
        "\n"
        + "=" * 60
    )

    print(
        "RECOMMENDED DESTINATIONS"
    )

    print(
        "=" * 60
    )

    for number, (
        index,
        place,
    ) in enumerate(
        places.iterrows(),
        start=1,
    ):

        print(
            f"\n{number}. "
            f"{place['Destination']}"
        )

        print(
            f"   District: "
            f"{place['District']}"
        )

        print(
            f"   Category: "
            f"{place['Primary_Category']}"
        )

        print(
            f"   Reviews: "
            f"{int(place['Review_Count']):,}"
        )

        print(
            f"   Preference Match: "
            f"{place['Match_Percentage']:.2f}%"
        )

        print(
            f"   Context Score: "
            f"{place['Context_Score']:.2f}%"
        )

        print(
            f"   Hybrid Score: "
            f"{place['Hybrid_Score']:.2f}%"
        )

        print(
            "   Why recommended:"
        )

        reasons = place[
            "Why_Recommended"
        ]

        for reason in reasons:

            print(
                f"      ✓ {reason}"
            )


# ============================================================
# MAIN TEST
# ============================================================

def main():

    # ========================================================
    # GUEST PREFERENCE PROFILE
    # ========================================================

    guest_preferences = {

        "Nature_Interest": 0.95,

        "Culture_Interest": 0.40,

        "Adventure_Interest": 0.90,

        "Food_Interest": 0.25,

        "Wellness_Interest": 0.35,

        "Entertainment_Interest": 0.20,

        "Shopping_Interest": 0.10,

        "Family_Interest": 0.30,
    }


    # ========================================================
    # GUEST CONTEXT
    # ========================================================

    guest_context = {

        "budget": "Medium",

        "district": "Badulla",

        "adults": 2,

        "children": 0,

        "stay_duration": 2,

        "activity_level": "Low",
    }


    # ========================================================
    # BOOKING CONTEXT
    # ========================================================

    booking_context = {

        "hotel":
            "Resort Hotel",

        "lead_time":
            30,

        "arrival_date_month":
            "August",

        "stays_in_weekend_nights":
            1,

        "stays_in_week_nights":
            3,

        "adults":
            2,

        "children":
            0,

        "babies":
            0,

        "meal":
            "BB",

        "country":
            "GBR",

        "market_segment":
            "Online TA",

        "distribution_channel":
            "TA/TO",

        "is_repeated_guest":
            0,

        "previous_cancellations":
            0,

        "previous_bookings_not_canceled":
            0,

        "reserved_room_type":
            "A",

        "deposit_type":
            "No Deposit",

        "customer_type":
            "Transient",

        "adr":
            125,

        "required_car_parking_spaces":
            0,

        "total_of_special_requests":
            2,

        "total_nights":
            4,

        "total_guests":
            2,
    }


    # ========================================================
    # RUN HYBRID ENGINE
    # ========================================================

    result = (
        generate_hybrid_recommendation(
            guest_preferences,
            guest_context,
            booking_context,
        )
    )


    # ========================================================
    # HEADER
    # ========================================================

    print(
        "\n"
        + "=" * 60
    )

    print(
        "HYBRID GUEST INTELLIGENCE"
    )

    print(
        "=" * 60
    )


    # ========================================================
    # GUEST SEGMENT
    # ========================================================

    print(
        "\nGuest Segment:"
    )

    print(
        f"   Cluster: "
        f"{result['guest_segment']['cluster']}"
    )

    print(
        f"   Segment: "
        f"{result['guest_segment']['segment']}"
    )


    # ========================================================
    # BOOKING RISK
    # ========================================================

    print(
        "\nBooking Cancellation Risk:"
    )

    print(
        f"   Probability: "
        f"{result['booking_risk']['probability']:.2f}%"
    )

    print(
        f"   Risk Level: "
        f"{result['booking_risk']['level']}"
    )


    # ========================================================
    # SERVICES
    # ========================================================

    print_services(
        result[
            "recommended_services"
        ]
    )


    # ========================================================
    # PLACES
    # ========================================================

    print_places(
        result[
            "recommended_places"
        ]
    )


    # ========================================================
    # OVERALL EXPLANATION
    # ========================================================

    print(
        "\n"
        + "=" * 60
    )

    print(
        "OVERALL RECOMMENDATION EXPLANATION"
    )

    print(
        "=" * 60
    )

    for item in result[
        "explanation"
    ]:

        print(
            f"✓ {item}"
        )


    # ========================================================
    # GUEST CONTEXT
    # ========================================================

    print(
        "\nGuest Context:"
    )

    print(
        f"   Budget: "
        f"{guest_context['budget']}"
    )

    print(
        f"   District: "
        f"{guest_context['district']}"
    )

    print(
        f"   Adults: "
        f"{guest_context['adults']}"
    )

    print(
        f"   Children: "
        f"{guest_context['children']}"
    )

    print(
        f"   Stay Duration: "
        f"{guest_context['stay_duration']} nights"
    )

    print(
        f"   Activity Level: "
        f"{guest_context['activity_level']}"
    )


    print(
        "\n"
        + "=" * 60
    )

    print(
        "HYBRID RECOMMENDATION COMPLETE"
    )

    print(
        "=" * 60
    )


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    main()