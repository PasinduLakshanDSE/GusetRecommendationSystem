from flask import Blueprint, jsonify, request

from services.hotel_intelligence_service import hotel_intelligence_service


hotel_intelligence_bp = Blueprint("hotel_intelligence", __name__)


@hotel_intelligence_bp.get("")
def get_hotel_intelligence():
    return jsonify(hotel_intelligence_service.summary(request.args.get("hotel")))
