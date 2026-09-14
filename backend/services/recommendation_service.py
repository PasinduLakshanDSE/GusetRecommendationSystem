from pathlib import Path
from datetime import date, datetime
import json

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from services.review_feedback_action_service import review_feedback_action_service
from services.hotel_dialogue_action_service import hotel_dialogue_action_service


PROJECT_ROOT = Path(__file__).resolve().parents[2]
SERVICES_PATH = PROJECT_ROOT / "data" / "raw" / "hotel_Service" / "hotel_services.csv"
DESTINATIONS_PATH = PROJECT_ROOT / "data" / "processed" / "destination_profiles.csv"
SEGMENT_MODEL_PATH = PROJECT_ROOT / "models" / "preference_segment_kmeans.joblib"
SEGMENT_SCALER_PATH = PROJECT_ROOT / "models" / "preference_segment_scaler.joblib"
SEGMENT_METADATA_PATH = PROJECT_ROOT / "models" / "preference_segment_metadata.json"
STAFF_ACTION_MODEL_PATH = PROJECT_ROOT / "models" / "staff_action_recommender.joblib"

PREFERENCE_FEATURES = [
    "Nature_Interest", "Culture_Interest", "Adventure_Interest", "Food_Interest",
    "Wellness_Interest", "Entertainment_Interest", "Shopping_Interest", "Family_Interest",
]
SERVICE_FEATURES = ["Nature", "Culture", "Adventure", "Food", "Wellness", "Entertainment", "Shopping", "Family"]
PLACE_FEATURES = [
    "Nature_Score", "Culture_Score", "Adventure_Score", "Food_Score",
    "Wellness_Score", "Entertainment_Score", "Shopping_Score", "Family_Score",
]
BUDGET_LEVELS = {"Low": 1, "Medium": 2, "High": 3, "Luxury": 4}
PURPOSE_CONTEXT = {
    "Leisure": {
        "weights": {"Nature": 0.4, "Culture": 0.4, "Food": 0.3, "Entertainment": 0.3},
        "summary": "Leisure context balances local culture, food, and relaxed experiences.",
        "staffActions": ["Offer a flexible local experience plan and ask which activity they would like to prioritise."],
    },
    "Family Holiday": {
        "weights": {"Family": 1.0, "Entertainment": 0.8, "Nature": 0.3},
        "summary": "Family-holiday context prioritises child-friendly and shared experiences.",
        "staffActions": ["Confirm family-friendly activity times and any child-specific room requirements."],
    },
    "Honeymoon": {
        "weights": {"Wellness": 0.8, "Food": 0.8, "Nature": 0.6},
        "summary": "Honeymoon context prioritises private, romantic, and restorative experiences.",
        "staffActions": ["Offer a private dining or romantic welcome option before arrival."],
    },
    "Wellness": {
        "weights": {"Wellness": 1.0, "Nature": 0.6},
        "summary": "Wellness context prioritises restorative and low-pressure experiences.",
        "staffActions": ["Offer wellness timings and keep the arrival experience calm and unhurried."],
    },
    "Adventure": {
        "weights": {"Adventure": 1.0, "Nature": 0.7},
        "summary": "Adventure context prioritises active outdoor experiences.",
        "staffActions": ["Confirm activity fitness requirements, weather conditions, and transport options."],
    },
    "Business": {
        "weights": {},
        "summary": "Business context prioritises shorter experiences around the guest's work schedule.",
        "staffActions": ["Confirm reliable Wi-Fi, workspace needs, and preferred meeting or meal times."],
    },
}
DISTRICT_ALIASES = {
    "ella": "Badulla",
    "bandarawela": "Badulla",
    "haputale": "Badulla",
    "welimada": "Badulla",
    "nuwara eliya": "Hatton",
    "kurunegala": "Kurunagela",
    "ratnapura": "Rathnapura",
}
NEARBY_DATASET_DISTRICTS = {
    # Kandy has no records in the current destination CSV. These are the
    # closest available areas represented by this prototype dataset.
    "kandy": ["Matale", "Hatton"],
}


class RecommendationService:
    def __init__(self):
        self.services = pd.read_csv(SERVICES_PATH)
        self.destinations = pd.read_csv(DESTINATIONS_PATH)
        self.segment_model = None
        self.segment_scaler = None
        self.segment_metadata = {}
        self.staff_action_model = None
        if all(path.exists() for path in [SEGMENT_MODEL_PATH, SEGMENT_SCALER_PATH, SEGMENT_METADATA_PATH]):
            self.segment_model = joblib.load(SEGMENT_MODEL_PATH)
            self.segment_scaler = joblib.load(SEGMENT_SCALER_PATH)
            self.segment_metadata = json.loads(SEGMENT_METADATA_PATH.read_text(encoding="utf-8"))
        if STAFF_ACTION_MODEL_PATH.exists():
            self.staff_action_model = joblib.load(STAFF_ACTION_MODEL_PATH)

    def analyze_guest(self, guest):
        preferences = guest["preferences"]
        preference_profile = self._build_preference_profile(preferences)
        ai_segment = self._predict_preference_segment(preferences, preference_profile["name"])
        purpose_context = self._purpose_context(guest.get("purposeOfVisit", "Leisure"))
        services = self._recommend_services(preferences, guest.get("budget", "Medium"), purpose_context)
        # Places are guided by interests and location only. Visit purpose is
        # deliberately excluded so a business guest who likes adventure still
        # sees adventure destinations.
        places, place_context = self._recommend_places(preferences, guest.get("district", ""))

        return {
            "segment": {
                **ai_segment,
            },
            "preferenceProfile": preference_profile["preferences"],
            "purposeContext": purpose_context,
            "placeContext": place_context,
            "services": services,
            "places": places,
            "staffActionPlan": self._recommend_staff_actions(guest, preferences, purpose_context),
            "summary": preference_profile["summary"],
            "confidence": self._calculate_profile_confidence(preferences, ai_segment),
            "bookingRisk": self._assess_booking_risk(guest),
        }

    def _purpose_context(self, purpose):
        context = PURPOSE_CONTEXT.get(purpose, PURPOSE_CONTEXT["Leisure"])
        return {"purpose": purpose or "Leisure", **context}

    def _build_preference_profile(self, preferences):
        """Build an explainable profile from interests explicitly selected by the guest."""
        selected = [
            feature.replace("_Interest", "")
            for feature in PREFERENCE_FEATURES
            if float(preferences.get(feature, 1)) >= 4
        ]
        if not selected:
            return {
                "name": "Flexible Stay Explorer",
                "preferences": [],
                "summary": "The guest has not selected specific interests yet. Staff should confirm preferred experiences at check-in.",
            }

        display_names = {"Food": "Food & Dining"}
        profile_names = [display_names.get(name, name) for name in selected[:3]]
        if len(profile_names) == 1:
            name = f"{profile_names[0]} Explorer"
        elif len(profile_names) == 2:
            name = f"{profile_names[0]} & {profile_names[1]} Explorer"
        else:
            name = f"{', '.join(profile_names[:-1])} & {profile_names[-1]} Explorer"

        listed = ", ".join(profile_names)
        return {
            "name": name,
            "preferences": [{"name": display_names.get(item, item), "score": 100} for item in selected],
            "summary": f"This profile is based on the guest's selected interests: {listed}. Recommendations are ranked from these stated preferences and stay details.",
        }

    def _predict_preference_segment(self, preferences, fallback_name):
        """Predict an AI segment and use labels generated from model centroids."""
        if max(float(preferences.get(name, 1)) for name in PREFERENCE_FEATURES) < 4:
            return {"name": fallback_name, "source": "Guest-selected interests"}
        if not self.segment_model or not self.segment_scaler:
            return {"name": fallback_name, "source": "Guest-selected interests (model unavailable)"}

        frame = pd.DataFrame([[preferences.get(name, 1) for name in PREFERENCE_FEATURES]], columns=PREFERENCE_FEATURES)
        cluster = int(self.segment_model.predict(self.segment_scaler.transform(frame))[0])
        cluster_data = self.segment_metadata.get("clusters", {}).get(str(cluster), {})
        return {
            "cluster": cluster,
            "name": cluster_data.get("name", fallback_name),
            "source": "K-Means preference segmentation",
            "centroid": cluster_data.get("centroid", {}),
        }

    def _calculate_profile_confidence(self, preferences, ai_segment):
        """Estimate how clearly the submitted preferences fit one K-Means segment.

        This is a profile-fit confidence score, not a cancellation probability
        or a claim that the model is certain about the guest's behaviour.
        """
        selected_count = sum(
            float(preferences.get(feature, 1)) >= 4
            for feature in PREFERENCE_FEATURES
        )
        coverage = sum(feature in preferences for feature in PREFERENCE_FEATURES) / len(PREFERENCE_FEATURES)

        # Older/backup analyses may not have a loaded segmentation model. The
        # score still reacts to supplied profile data instead of using a fixed UI value.
        if not self.segment_model or not self.segment_scaler or "cluster" not in ai_segment:
            score = round(52 + coverage * 22 + min(selected_count, 3) * 5)
            return {
                "score": max(55, min(89, score)),
                "label": "Preference data confidence",
                "basis": "Submitted preference coverage",
            }

        frame = pd.DataFrame(
            [[preferences.get(feature, 1) for feature in PREFERENCE_FEATURES]],
            columns=PREFERENCE_FEATURES,
        )
        point = self.segment_scaler.transform(frame)[0]
        distances = np.linalg.norm(self.segment_model.cluster_centers_ - point, axis=1)
        ordered = np.sort(distances)
        nearest = float(ordered[0])
        second_nearest = float(ordered[1]) if len(ordered) > 1 else nearest + 1
        separation = max(0.0, min(1.0, (second_nearest - nearest) / max(second_nearest, 0.001)))
        proximity = max(0.0, min(1.0, 1 - nearest / max(float(np.mean(distances)), 0.001)))

        score = round(55 + coverage * 14 + separation * 17 + proximity * 10 + min(selected_count, 3) * 2)
        return {
            "score": max(55, min(96, score)),
            "label": "Profile-fit confidence",
            "basis": "K-Means segment fit and submitted preference coverage",
        }

    def _recommend_staff_actions(self, guest, preferences, purpose_context):
        """Rank actions using real review-NLP risks and guest relevance."""
        dialogue_actions = hotel_dialogue_action_service.recommend(
            guest, preferences, purpose_context.get("purpose", "Leisure")
        )
        if dialogue_actions:
            return dialogue_actions
        feedback_actions = review_feedback_action_service.recommend(
            guest, preferences, purpose_context.get("purpose", "Leisure")
        )
        if feedback_actions:
            return feedback_actions

        """Legacy fallback if real feedback intelligence has not been trained."""
        if not self.staff_action_model:
            return {
                "source": "Fallback staff guidance",
                "actions": [
                    {"action": action, "match": 75, "reason": "Matches the stated visit purpose."}
                    for action in purpose_context.get("staffActions", [])
                ],
            }

        payload = self.staff_action_model
        purpose = purpose_context.get("purpose", "Leisure")
        budget_value = BUDGET_LEVELS.get(guest.get("budget", "Medium"), 2)
        values = {feature.replace("_Interest", ""): float(preferences.get(feature, 1)) for feature in PREFERENCE_FEATURES}
        values.update({
            "stayDuration": int(guest.get("stayDuration") or 1),
            "adults": int(guest.get("adults") or 1),
            "children": int(guest.get("children") or 0),
            "budgetValue": budget_value,
            "foodPreference": int(bool(guest.get("foodPreference"))),
            "accessibility": int(bool(guest.get("accessibilityNeeds"))),
        })
        for known_purpose in PURPOSE_CONTEXT:
            values[f"purpose__{known_purpose}"] = int(purpose == known_purpose)
        frame = pd.DataFrame([[values.get(column, 0) for column in payload["feature_columns"]]], columns=payload["feature_columns"])
        probabilities = payload["model"].predict_proba(frame)[0]
        reasons = self._staff_action_reasons(guest, preferences, purpose)
        ranked = sorted(zip(payload["actions"], probabilities), key=lambda item: item[1], reverse=True)
        probability_by_action = dict(ranked)
        essential_actions = self._essential_staff_actions(guest, preferences, purpose)
        essential_ranked = sorted(
            ((action, probability_by_action[action]) for action in essential_actions if action in probability_by_action),
            key=lambda item: item[1],
            reverse=True,
        )
        ordered = []
        for action, probability in essential_ranked + ranked:
            if action not in {item[0] for item in ordered}:
                ordered.append((action, probability))
        # Always show at least five actions. If the guest selected many
        # distinct interests, keep every required preference action visible.
        plan_size = max(5, len(essential_ranked))
        actions = [
            {
                "action": action,
                # Random-forest probabilities trained on a small demonstration
                # dataset can be overconfident. Use this as a bounded ranking
                # score in the UI rather than presenting it as certainty.
                "match": round(60 + float(probability) * 32),
                "reason": reasons.get(action, "Recommended from the combined guest context."),
            }
            for action, probability in ordered[:plan_size]
        ]
        return {
            "source": "Trained multi-label staff-action recommender with preference coverage",
            "actions": actions,
        }

    def _essential_staff_actions(self, guest, preferences, purpose):
        """Ensure an action plan visibly addresses every strong guest preference."""
        actions = []
        purpose_actions = {
            "Business": ["Prepare reliable Wi-Fi and an in-room workspace", "Arrange express check-in and flexible arrival support"],
            "Family Holiday": ["Confirm family room setup and child amenities"],
            "Honeymoon": ["Arrange a romantic welcome and private dining option"],
            "Wellness": ["Offer spa or wellness appointment times"],
            "Adventure": ["Confirm guided adventure safety, weather, and transport"],
        }
        actions.extend(purpose_actions.get(purpose, []))
        preference_actions = {
            "Nature_Interest": "Prepare a nature activity briefing and suitable timing",
            "Culture_Interest": "Share a local culture and heritage itinerary",
            "Adventure_Interest": "Confirm guided adventure safety, weather, and transport",
            "Food_Interest": "Confirm dietary dining options before arrival",
            "Wellness_Interest": "Offer spa or wellness appointment times",
            "Entertainment_Interest": "Curate local entertainment options for the preferred time",
            "Shopping_Interest": "Prepare a local shopping and artisan-market guide",
            "Family_Interest": "Share child-friendly activity times and transport options",
        }
        actions.extend(
            action for feature, action in preference_actions.items()
            if float(preferences.get(feature, 1)) >= 4
        )
        if guest.get("foodPreference"):
            actions.append("Confirm dietary dining options before arrival")
        if guest.get("accessibilityNeeds"):
            actions.append("Review accessibility needs and prepare appropriate support")
        return list(dict.fromkeys(actions))

    def _staff_action_reasons(self, guest, preferences, purpose):
        reasons = {}
        if purpose == "Business":
            reasons["Prepare reliable Wi-Fi and an in-room workspace"] = "Business visit context requires a productive setup."
            reasons["Arrange express check-in and flexible arrival support"] = "Business guests often need a time-efficient arrival."
        if purpose == "Family Holiday" or int(guest.get("children") or 0) > 0:
            reasons["Confirm family room setup and child amenities"] = "Family context and guest count indicate shared stay needs."
            reasons["Share child-friendly activity times and transport options"] = "Family-friendly timing supports the planned stay."
        if purpose == "Honeymoon":
            reasons["Arrange a romantic welcome and private dining option"] = "Honeymoon context supports a private, memorable arrival."
        if float(preferences.get("Adventure_Interest", 1)) >= 4:
            reasons["Confirm guided adventure safety, weather, and transport"] = "Adventure is one of the guest's strongest interests."
        if float(preferences.get("Nature_Interest", 1)) >= 4:
            reasons["Prepare a nature activity briefing and suitable timing"] = "Nature is one of the guest's strongest interests."
        if float(preferences.get("Culture_Interest", 1)) >= 4:
            reasons["Share a local culture and heritage itinerary"] = "Culture is one of the guest's strongest interests."
        if float(preferences.get("Wellness_Interest", 1)) >= 4 or purpose == "Wellness":
            reasons["Offer spa or wellness appointment times"] = "Wellness preference or visit purpose is present."
            reasons["Prepare a quiet room and restful arrival experience"] = "A calm arrival supports the guest's wellbeing preferences."
        if guest.get("foodPreference"):
            reasons["Confirm dietary dining options before arrival"] = "A dining preference was submitted with the guest profile."
        if guest.get("accessibilityNeeds"):
            reasons["Review accessibility needs and prepare appropriate support"] = "Accessibility support was requested by the guest."
        if float(preferences.get("Entertainment_Interest", 1)) >= 4:
            reasons["Curate local entertainment options for the preferred time"] = "Entertainment is one of the guest's strongest interests."
        if float(preferences.get("Shopping_Interest", 1)) >= 4:
            reasons["Prepare a local shopping and artisan-market guide"] = "Shopping is one of the guest's strongest interests."
        return reasons

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

    def _recommend_services(self, preferences, budget, purpose_context):
        data = self.services.copy()
        guest_vector = [[preferences[name] for name in PREFERENCE_FEATURES]]
        data["preference_score"] = cosine_similarity(guest_vector, data[SERVICE_FEATURES].values)[0]
        guest_level = BUDGET_LEVELS.get(budget, 2)
        data["budget_score"] = data["Min_Budget"].map(
            lambda value: {0: 1, 1: 0.7, 2: 0.3}.get(abs(guest_level - BUDGET_LEVELS.get(value, 2)), 0.1)
        )
        weights = purpose_context["weights"]
        if weights:
            total_weight = sum(weights.values())
            data["purpose_score"] = sum(data[feature] * weight for feature, weight in weights.items()) / total_weight
        elif purpose_context["purpose"] == "Business":
            data["purpose_score"] = data["Duration_Hours"].map(lambda hours: 1 if hours <= 3 else 0.35)
        else:
            data["purpose_score"] = 0.5
        data["match"] = (data["preference_score"] * 0.70 + data["budget_score"] * 0.15 + data["purpose_score"] * 0.15) * 100
        return [
            {"id": row.Service_ID, "name": row.Service_Name, "category": row.Category, "duration_hours": int(row.Duration_Hours), "match": round(float(row.match), 1), "purpose_match": round(float(row.purpose_score) * 100, 1)}
            for row in data.sort_values("match", ascending=False).head(3).itertuples()
        ]

    def _resolve_district(self, requested_district):
        normalized = " ".join(str(requested_district or "").lower().split())
        if not normalized:
            return [], "none"
        available = {district.lower(): district for district in self.destinations["District"].dropna().unique()}
        if normalized in available:
            return [available[normalized]], "exact"
        if normalized in DISTRICT_ALIASES:
            return [DISTRICT_ALIASES[normalized]], "alias"
        if normalized in NEARBY_DATASET_DISTRICTS:
            return NEARBY_DATASET_DISTRICTS[normalized], "nearby"
        for alias, district in DISTRICT_ALIASES.items():
            if alias in normalized:
                return [district], "alias"
        for lowercase_district, district in available.items():
            if lowercase_district in normalized or normalized in lowercase_district:
                return [district], "partial"
        return [], "none"

    def _recommend_places(self, preferences, district):
        data = self.destinations.copy()
        applied_districts, match_type = self._resolve_district(district)
        if applied_districts:
            normalized_districts = {item.lower() for item in applied_districts}
            data = data[data["District"].str.lower().isin(normalized_districts)].copy()
        guest_vector = [[preferences[name] for name in PREFERENCE_FEATURES]]
        data["similarity"] = cosine_similarity(guest_vector, data[PLACE_FEATURES].values)[0]
        data["reliability"] = data["Review_Count"] / max(data["Review_Count"].max(), 1)
        # Destination relevance comes mostly from the selected interest vector;
        # review reliability acts only as a small quality signal.
        data["match"] = (data["similarity"] * 0.90 + data["reliability"] * 0.10) * 100
        places = [
            {"name": row.Destination, "district": row.District, "category": row.Primary_Category, "match": round(float(row.match), 1)}
            for row in data.sort_values("match", ascending=False).head(3).itertuples()
        ]
        place_context = {
            "requestedDistrict": district or None,
            "appliedDistricts": applied_districts,
            "districtFilterApplied": bool(applied_districts),
            "message": (
                f"Kandy is not available in the destination dataset, so recommendations use nearby dataset areas: {', '.join(applied_districts)}."
                if match_type == "nearby"
                else f"Recommendations were filtered to {', '.join(applied_districts)}."
                if applied_districts
                else "No matching district was found, so recommendations use all available districts."
            ),
        }
        return places, place_context


recommendation_service = RecommendationService()
