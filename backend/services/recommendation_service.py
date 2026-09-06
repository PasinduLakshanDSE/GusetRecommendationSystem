from pathlib import Path
from datetime import date, datetime

import joblib
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity


PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = PROJECT_ROOT / "models" / "kmeans_guest_segments.joblib"
SCALER_PATH = PROJECT_ROOT / "models" / "guest_segment_scaler.joblib"
SERVICES_PATH = PROJECT_ROOT / "data" / "raw" / "hotel_Service" / "hotel_services.csv"
DESTINATIONS_PATH = PROJECT_ROOT / "data" / "processed" / "destination_profiles.csv"

SEGMENT_FEATURES = [
    "Nature_Interest", "Culture_Interest", "Adventure_Interest", "Food_Interest", "Wellness_Interest",
    "Entertainment_Interest", "Shopping_Interest", "Family_Interest",
]
PREFERENCE_FEATURES = [
    "Nature_Interest", "Culture_Interest", "Adventure_Interest", "Food_Interest",
    "Wellness_Interest", "Entertainment_Interest", "Shopping_Interest", "Family_Interest",
]
SERVICE_FEATURES = ["Nature", "Culture", "Adventure", "Food", "Wellness", "Entertainment", "Shopping", "Family"]
PLACE_FEATURES = [
    "Nature_Score", "Culture_Score", "Adventure_Score", "Food_Score",
    "Wellness_Score", "Entertainment_Score", "Shopping_Score", "Family_Score",
]
SEGMENT_NAMES = {
    0: "Nature & Wellness Explorer",
    1: "Family Entertainment Explorer",
    2: "Shopping & Food Explorer",
}
BUDGET_LEVELS = {"Low": 1, "Medium": 2, "High": 3, "Luxury": 4}


class RecommendationService:
    def __init__(self):
        self.segment_model = joblib.load(MODEL_PATH)
        self.segment_scaler = joblib.load(SCALER_PATH)
        self.services = pd.read_csv(SERVICES_PATH)
        self.destinations = pd.read_csv(DESTINATIONS_PATH)

    def analyze_guest(self, guest):
        preferences = guest["preferences"]
        cluster, segment = self._segment_guest(preferences)
        services = self._recommend_services(preferences, guest.get("budget", "Medium"))
        places = self._recommend_places(preferences, guest.get("district", ""))

        return {
            "segment": {"cluster": cluster, "name": segment},
            "services": services,
            "places": places,
            "summary": f"{segment} with a top recommendation of {services[0]['name']}.",
            "bookingRisk": self._assess_booking_risk(guest),
        }

    def _assess_booking_risk(self, guest):
        """Return an explainable booking-risk signal for hotel staff follow-up."""
        score = 18
        reasons = []
        arrival_date = guest.get("arrivalDate")

        if arrival_date:
            try:
                arrival = datetime.fromisoformat(str(arrival_date).replace("Z", "+00:00")).date()
                days_until_arrival = (arrival - date.today()).days
                if days_until_arrival > 30:
                    score += 12
                    reasons.append("Arrival is more than 30 days away, so plans may still change.")
                elif days_until_arrival > 14:
                    score += 6
                    reasons.append("Arrival is more than two weeks away.")
                elif days_until_arrival >= 0:
                    reasons.append("Arrival is approaching, which usually reduces cancellation likelihood.")
            except (TypeError, ValueError):
                reasons.append("Arrival date needs confirmation.")
                score += 5
        else:
            reasons.append("No arrival date is recorded yet.")
            score += 10

        if guest.get("budget") == "Low":
            score += 7
            reasons.append("A price-sensitive stay may benefit from an early value confirmation.")
        if int(guest.get("stayDuration") or 0) >= 5:
            score -= 3
            reasons.append("A longer planned stay indicates stronger booking intent.")
        if guest.get("purposeOfVisit") in {"Business", "Conference"}:
            score -= 3
            reasons.append("The stated visit purpose suggests a more structured itinerary.")

        history = guest.get("bookingHistory") or {}
        previous_bookings = int(history.get("previousBookings") or 0)
        previous_cancellations = int(history.get("previousCancellations") or 0)
        completed_stays = int(history.get("completedStays") or 0)
        match_methods = history.get("matchMethods") or []
        if "full name and country" in match_methods and "email" not in match_methods and "phone" not in match_methods:
            reasons.append("Repeat-guest history was matched using the same full name and country.")
        if previous_cancellations:
            cancellation_weight = min(30, previous_cancellations * 15)
            score += cancellation_weight
            reasons.append(
                f"Guest history includes {previous_cancellations} previous cancellation(s)."
            )
        elif previous_bookings:
            repeat_guest_credit = min(6, previous_bookings * 2)
            score -= repeat_guest_credit
            reasons.append(
                f"Repeat guest has {previous_bookings} earlier booking(s) with no recorded cancellation."
            )
        if completed_stays:
            score -= min(12, completed_stays * 4)
            reasons.append(
                f"Guest has completed {completed_stays} previous stay(s), indicating reliable booking history."
            )

        score = max(8, min(72, score))
        if score >= 45:
            level = "High"
            recommendation = "Contact the guest today to confirm arrival plans and offer flexible support."
        elif score >= 28:
            level = "Medium"
            recommendation = "Send a friendly pre-arrival confirmation with the personalized stay plan."
        else:
            level = "Low"
            recommendation = "Keep the personalized welcome plan ready and monitor for any updates."

        return {
            "level": level,
            "probability": score,
            "reasons": reasons[:3],
            "recommendation": recommendation,
            "history": {
                "repeatGuest": bool(history.get("repeatGuest")),
                "previousBookings": previous_bookings,
                "previousCancellations": previous_cancellations,
                "completedStays": completed_stays,
                "matchMethods": match_methods,
            },
        }

    def _segment_guest(self, preferences):
        frame = pd.DataFrame([[preferences[name] for name in SEGMENT_FEATURES]], columns=SEGMENT_FEATURES)
        cluster = int(self.segment_model.predict(self.segment_scaler.transform(frame))[0])
        return cluster, SEGMENT_NAMES.get(cluster, f"Guest cluster {cluster}")

    def _recommend_services(self, preferences, budget):
        data = self.services.copy()
        guest_vector = [[preferences[name] for name in PREFERENCE_FEATURES]]
        data["preference_score"] = cosine_similarity(guest_vector, data[SERVICE_FEATURES].values)[0]
        guest_level = BUDGET_LEVELS.get(budget, 2)
        data["budget_score"] = data["Min_Budget"].map(
            lambda value: {0: 1, 1: 0.7, 2: 0.3}.get(abs(guest_level - BUDGET_LEVELS.get(value, 2)), 0.1)
        )
        data["match"] = (data["preference_score"] * 0.85 + data["budget_score"] * 0.15) * 100
        return [
            {"id": row.Service_ID, "name": row.Service_Name, "category": row.Category, "duration_hours": int(row.Duration_Hours), "match": round(float(row.match), 1)}
            for row in data.sort_values("match", ascending=False).head(3).itertuples()
        ]

    def _recommend_places(self, preferences, district):
        data = self.destinations.copy()
        if district:
            local = data[data["District"].str.lower() == district.lower()]
            if not local.empty:
                data = local.copy()
        guest_vector = [[preferences[name] for name in PREFERENCE_FEATURES]]
        data["similarity"] = cosine_similarity(guest_vector, data[PLACE_FEATURES].values)[0]
        data["reliability"] = data["Review_Count"] / max(data["Review_Count"].max(), 1)
        data["match"] = (data["similarity"] * 0.9 + data["reliability"] * 0.1) * 100
        return [
            {"name": row.Destination, "district": row.District, "category": row.Primary_Category, "match": round(float(row.match), 1)}
            for row in data.sort_values("match", ascending=False).head(3).itertuples()
        ]


recommendation_service = RecommendationService()
