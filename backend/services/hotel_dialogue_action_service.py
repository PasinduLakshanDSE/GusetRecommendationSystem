"""Predict hotel dialogue actions and generate a grounded plan with local Ollama."""
from __future__ import annotations

import json
import os
from pathlib import Path
from urllib.error import URLError
from urllib.request import Request, urlopen

import joblib
import numpy as np

from services.review_feedback_action_service import review_feedback_action_service


ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = ROOT / "models" / "hotel_dialogue_action_model.joblib"
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")


class HotelDialogueActionService:
    def __init__(self):
        self.model = joblib.load(MODEL_PATH) if MODEL_PATH.exists() else None

    def recommend(self, guest, preferences, purpose):
        if not self.model:
            return None
        profile = self._profile_text(guest, preferences, purpose)
        probabilities = self.model.predict_proba([profile])[0]
        classes = self.model.named_steps["classifier"].classes_
        indexes = np.argsort(probabilities)[::-1][:5]
        predicted = [{"type": str(classes[index]), "probability": round(float(probabilities[index]) * 100, 1)} for index in indexes]
        generated = self._generate_with_ollama(profile, predicted)
        if generated:
            return {"source": f"Local Ollama AI plan grounded by dialogue-action NLP and Booking.com feedback", "actions": generated, "predictedActionTypes": predicted}
        # This fallback still comes directly from classifier output. It does
        # not invent static staff-action candidates if Ollama is offline.
        return {
            "source": "Hotel dialogue action classifier (start Ollama for generated action sentences)",
            "actions": [
                {"action": item["type"].replace("-", ": "), "match": item["probability"], "reason": "Predicted next hotel service action from the guest context."}
                for item in predicted
            ],
            "predictedActionTypes": predicted,
        }

    def _profile_text(self, guest, preferences, purpose):
        interests = ", ".join(feature.replace("_Interest", "") for feature, value in preferences.items() if float(value) >= 4) or "no specific interest"
        return (
            f"Hotel guest needs assistance. Purpose: {purpose}. Adults: {int(guest.get('adults') or 1)}. "
            f"Children: {int(guest.get('children') or 0)}. Stay: {int(guest.get('stayDuration') or 1)} nights. "
            f"Budget: {guest.get('budget') or 'Medium'}. Room: {guest.get('roomPreference') or 'not specified'}. "
            f"Food: {guest.get('foodPreference') or 'not specified'}. Interests: {interests}. "
            f"Requests: {guest.get('specialRequests') or 'none'}. Accessibility: {guest.get('accessibilityNeeds') or 'none'}."
        )

    def _generate_with_ollama(self, profile, predicted):
        feedback = review_feedback_action_service.top_feedback_aspects()
        prompt = (
            "You are a hotel operations AI. Create exactly 5 unique, practical pre-arrival staff actions. "
            "Use only the guest profile, predicted hotel dialogue action types, and review feedback risks below. "
            "Do not mention machine learning, datasets, or probabilities. Do not make up bookings or availability. "
            "Return JSON only in this exact form: {\"actions\":[{\"action\":\"...\",\"reason\":\"...\",\"match\":80}]}.\n\n"
            f"Guest profile: {profile}\nPredicted dialogue actions: {json.dumps(predicted)}\nFeedback risks: {json.dumps(feedback)}"
        )
        payload = json.dumps({"model": OLLAMA_MODEL, "prompt": prompt, "stream": False, "format": "json", "options": {"temperature": 0.35}}).encode("utf-8")
        request = Request(OLLAMA_URL, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        try:
            # A local 3B model can take longer on its first CPU request.
            with urlopen(request, timeout=120) as response:
                raw = json.loads(response.read().decode("utf-8"))
            actions = json.loads(raw.get("response", "{}")).get("actions", [])
        except (URLError, TimeoutError, json.JSONDecodeError, OSError):
            return None
        cleaned = []
        for item in actions if isinstance(actions, list) else []:
            if not isinstance(item, dict) or not str(item.get("action", "")).strip():
                continue
            cleaned.append({"action": str(item["action"]).strip(), "reason": str(item.get("reason", "Guest-specific AI action.")).strip(), "match": max(50, min(96, int(item.get("match", 75))))})
            if len(cleaned) == 5:
                break
        return cleaned if len(cleaned) >= 5 else None


hotel_dialogue_action_service = HotelDialogueActionService()
