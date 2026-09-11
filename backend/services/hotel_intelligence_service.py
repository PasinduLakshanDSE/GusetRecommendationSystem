"""Serve aggregated hotel-review sentiment and aspect intelligence."""
from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]
ASPECT_PATH = PROJECT_ROOT / "data" / "processed" / "hotel_aspect_intelligence.csv"


class HotelIntelligenceService:
    def __init__(self):
        self.data = pd.read_csv(ASPECT_PATH) if ASPECT_PATH.exists() else pd.DataFrame()

    def summary(self, hotel_name=None):
        if self.data.empty:
            return {"source": "Hotel review intelligence unavailable", "aspects": [], "alerts": []}
        data = self.data.copy()
        if hotel_name:
            exact = data[data["Hotel_Name"].str.casefold() == str(hotel_name).casefold()]
            if not exact.empty:
                data = exact
        grouped = data.groupby("Aspect", as_index=False).agg(
            Negative=("Negative", "sum"),
            Neutral=("Neutral", "sum"),
            Positive=("Positive", "sum"),
            Total=("Total", "sum"),
        )
        grouped["sentimentScore"] = ((grouped["Positive"] - grouped["Negative"]) / grouped["Total"].clip(lower=1) * 100).round(1)
        grouped["negativePercentage"] = (grouped["Negative"] / grouped["Total"].clip(lower=1) * 100).round(1)
        grouped["positivePercentage"] = (grouped["Positive"] / grouped["Total"].clip(lower=1) * 100).round(1)
        aspects = [
            {
                "name": row.Aspect.replace("_", " "),
                "sentimentScore": float(row.sentimentScore),
                "negativePercentage": float(row.negativePercentage),
                "positivePercentage": float(row.positivePercentage),
                "reviewCount": int(row.Total),
                "status": "Strong" if row.sentimentScore >= 30 else "Stable" if row.sentimentScore >= 5 else "Needs attention",
            }
            for row in grouped.sort_values("sentimentScore", ascending=True).itertuples()
        ]
        alerts = [
            {
                "aspect": item["name"],
                "message": f"{item['negativePercentage']}% negative sentiment across {item['reviewCount']:,} review mentions.",
            }
            for item in aspects
            if item["negativePercentage"] >= 12 or item["sentimentScore"] < 5
        ][:3]
        return {
            "source": "Trained hotel-review sentiment and aspect model",
            "scope": "Selected hotel" if hotel_name and len(data) < len(self.data) else "All available hotel reviews",
            "aspects": sorted(aspects, key=lambda item: item["sentimentScore"], reverse=True),
            "alerts": alerts,
        }


hotel_intelligence_service = HotelIntelligenceService()
