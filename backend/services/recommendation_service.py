from pathlib import Path

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
