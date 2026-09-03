from datetime import datetime, timezone
from uuid import uuid4

from flask import Blueprint, jsonify, request

from services.recommendation_service import recommendation_service


guests_bp = Blueprint("guests", __name__)
guest_profiles = []
REQUIRED_PREFERENCES = [
    "Nature_Interest", "Culture_Interest", "Adventure_Interest", "Food_Interest",
    "Wellness_Interest", "Entertainment_Interest", "Shopping_Interest", "Family_Interest",
]


@guests_bp.route("", methods=["OPTIONS"])
def guests_options():
    return "", 204


@guests_bp.get("")
def list_guests():
    return jsonify({"guests": guest_profiles})


@guests_bp.post("")
def create_guest():
    payload = request.get_json(silent=True) or {}
    missing = [field for field in ("name", "email", "country", "preferences") if not payload.get(field)]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    preferences = payload["preferences"]
    if any(field not in preferences for field in REQUIRED_PREFERENCES):
        return jsonify({"error": "All eight preference values are required."}), 400

    try:
        analysis = recommendation_service.analyze_guest(payload)
    except Exception as error:
        return jsonify({"error": f"AI analysis failed: {error}"}), 500

    profile = {
        "id": str(uuid4()),
        "name": payload["name"],
        "email": payload["email"],
        "phone": payload.get("phone", ""),
        "country": payload["country"],
        "adults": payload.get("adults", 1),
        "children": payload.get("children", 0),
        "budget": payload.get("budget", "Medium"),
        "district": payload.get("district", ""),
        "preferences": preferences,
        "analysis": analysis,
        "status": "Ready to review",
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }
    guest_profiles.insert(0, profile)
    return jsonify(profile), 201
