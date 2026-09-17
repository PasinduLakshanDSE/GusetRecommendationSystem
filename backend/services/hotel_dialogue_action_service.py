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
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:1b")


class HotelDialogueActionService:
    def __init__(self):
        self.model = joblib.load(MODEL_PATH) if MODEL_PATH.exists() else None

    def recommend(self, guest, preferences, purpose):
        profile = self._profile_text(guest, preferences, purpose)
        predicted = self._predicted_actions(profile)
        actions = self._verified_actions(guest, preferences, purpose)
        generated_reasons = self._generate_reasons_with_ollama(profile, actions, predicted)
        if generated_reasons:
            for index, reason in enumerate(generated_reasons):
                actions[index]["reason"] = reason
            source = f"Five validated actions selected from guest context and refined by local Ollama ({OLLAMA_MODEL})"
        else:
            source = "Five validated actions selected from guest context, preference AI, and hotel-review NLP"
        return {
            "source": source,
            "actions": actions,
            "predictedActionTypes": predicted,
        }

    def _predicted_actions(self, profile):
        if not self.model:
            return []
        probabilities = self.model.predict_proba([profile])[0]
        classes = self.model.named_steps["classifier"].classes_
        indexes = np.argsort(probabilities)[::-1][:5]
        return [
            {"type": str(classes[index]), "probability": round(float(probabilities[index]) * 100, 1)}
            for index in indexes
        ]

    def _verified_actions(self, guest, preferences, purpose):
        """Create exactly five actions only from submitted guest facts."""
        purpose = str(purpose or guest.get("purposeOfVisit") or "Leisure").strip()
        purpose_key = purpose.lower()
        requests = str(guest.get("specialRequests") or "").strip().lower()
        room = str(guest.get("roomPreference") or "").strip()
        food = str(guest.get("foodPreference") or "").strip()
        accessibility = str(guest.get("accessibilityNeeds") or "").strip()
        children = int(guest.get("children") or 0)
        interests = {
            key.replace("_Interest", "").lower()
            for key, value in (preferences or {}).items()
            if float(value or 0) >= 4
        }
        actions = []

        def add(action, reason, match):
            if len(actions) < 5 and not any(item["action"] == action for item in actions):
                actions.append({"action": action, "reason": reason, "match": match})

        # Explicit guest requests take priority.
        if any(word in requests for word in ("airport", "pickup", "transfer")):
            add("Confirm the requested airport transfer or arrival transport", "The guest explicitly requested arrival transport support.", 94)
        if any(word in requests for word in ("wifi", "wi-fi", "internet")) or "business" in purpose_key:
            add("Test high-speed Wi-Fi before check-in and share connection details", "Reliable connectivity is supported by the submitted business or Wi-Fi requirement.", 93 if "business" in purpose_key else 89)
        if any(word in requests for word in ("meeting", "workspace", "work space", "desk")):
            add("Confirm the requested workspace or meeting arrangement before arrival", "The guest specifically mentioned a workspace or meeting need.", 91)
        if any(word in requests for word in ("quiet", "noise", "silent")):
            add("Allocate the quietest suitable room and note the noise preference", "The special request asks for a quiet stay environment.", 89)
        if accessibility:
            add("Review accessibility requirements with the assigned arrival host", "Accessibility support was explicitly provided in the guest profile.", 96)

        # Form choices and preference AI produce the remaining contextual actions.
        if room:
            add(f"Verify the requested {room} room setup before arrival", "This directly prepares the room preference submitted by the guest.", 88)
        if food:
            add(f"Confirm suitable {food} dining options and meal timing", "This is based on the guest's submitted dining preference.", 87)
        if children > 0 or "family" in interests or "family" in purpose_key:
            add("Prepare child-friendly amenities and share suitable activity times", "The party includes children or has a family-stay context.", 90)
        if "business" in purpose_key:
            add("Prepare a practical work-ready arrival with a desk and check-in contact", "The purpose of visit is business, so a productive arrival is important.", 88)
        if "honeymoon" in purpose_key or "romantic" in purpose_key:
            add("Offer an optional romantic welcome or private-dining arrangement", "The stated visit purpose supports a private, memorable arrival.", 88)
        if "wellness" in interests or "wellness" in purpose_key:
            add("Share wellness and relaxation service times before check-in", "Wellness is a strong submitted preference or visit context.", 84)
        if "adventure" in interests:
            add("Share activity transport, weather, timing, and safety guidance", "Adventure is one of the guest's selected interests.", 84)
        if "nature" in interests:
            add("Prepare a local nature-experience guide matched to the stay duration", "Nature is one of the guest's selected interests.", 82)
        if "culture" in interests:
            add("Prepare a local culture and heritage guide for the guest", "Culture is one of the guest's selected interests.", 81)
        if "shopping" in interests:
            add("Prepare nearby shopping and artisan-market suggestions", "Shopping is one of the guest's selected interests.", 80)
        if "entertainment" in interests:
            add("Share suitable evening entertainment options and timings", "Entertainment is one of the guest's selected interests.", 79)
        if "food" in interests and not food:
            add("Share local dining recommendations and confirm dietary needs", "Food and dining is one of the guest's selected interests.", 81)

        # Safe hotel operations fill only missing slots; they do not claim a guest need.
        for action, reason, match in [
            ("Assign a named arrival contact and confirm check-in details", "A clear arrival handover supports a smooth hotel check-in.", 75),
            ("Complete a pre-arrival room cleanliness and comfort check", "Room quality is a high-impact hotel-review consideration before arrival.", 74),
            ("Confirm the guest's special requests with the relevant team", "The hotel should verify recorded guest requests before arrival.", 73),
            ("Share the hotel contact channel for changes before arrival", "This gives the guest a clear route to update stay needs.", 72),
            ("Review the arrival plan at the next staff handover", "A handover check helps the team deliver preferences consistently.", 71),
        ]:
            add(action, reason, match)
        return actions[:5]

    def _profile_text(self, guest, preferences, purpose):
        interests = ", ".join(feature.replace("_Interest", "") for feature, value in preferences.items() if float(value) >= 4) or "no specific interest"
        return (
            f"Hotel guest needs assistance. Purpose: {purpose}. Adults: {int(guest.get('adults') or 1)}. "
            f"Children: {int(guest.get('children') or 0)}. Stay: {int(guest.get('stayDuration') or 1)} nights. "
            f"Budget: {guest.get('budget') or 'Medium'}. Room: {guest.get('roomPreference') or 'not specified'}. "
            f"Food: {guest.get('foodPreference') or 'not specified'}. Interests: {interests}. "
            f"Requests: {guest.get('specialRequests') or 'none'}. Accessibility: {guest.get('accessibilityNeeds') or 'none'}."
        )

    def _generate_reasons_with_ollama(self, profile, verified_actions, predicted):
        feedback = review_feedback_action_service.top_feedback_aspects()
        prompt = (
            "Improve the reasons for exactly five already verified hotel staff actions. Keep the same order. "
            "Do not add, remove, rename, merge, or replace actions. Do not invent any guest need. "
            "Return JSON only: {\"actions\":[{\"reason\":\"...\"},{\"reason\":\"...\"},{\"reason\":\"...\"},{\"reason\":\"...\"},{\"reason\":\"...\"}]}.\n\n"
            f"Guest profile: {profile}\nVerified actions: {json.dumps(verified_actions)}\n"
            f"Dialogue signals: {json.dumps(predicted)}\nFeedback risks: {json.dumps(feedback)}"
        )
        payload = json.dumps({"model": OLLAMA_MODEL, "prompt": prompt, "stream": False, "format": "json", "options": {"temperature": 0.1, "num_predict": 300}}).encode("utf-8")
        request = Request(OLLAMA_URL, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        try:
            with urlopen(request, timeout=90) as response:
                raw = json.loads(response.read().decode("utf-8"))
            actions = json.loads(raw.get("response", "{}")).get("actions", [])
        except (URLError, TimeoutError, json.JSONDecodeError, OSError):
            return None
        if not isinstance(actions, list) or len(actions) != 5:
            return None
        reasons = []
        for item in actions:
            reason = str(item.get("reason", "")).strip() if isinstance(item, dict) else ""
            if not reason or len(reason) > 240:
                return None
            reasons.append(reason)
        return reasons


hotel_dialogue_action_service = HotelDialogueActionService()
