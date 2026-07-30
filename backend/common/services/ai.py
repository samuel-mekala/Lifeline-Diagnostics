"""Provider-agnostic interfaces for future AI capabilities.

Concrete LLM clients belong in deployment-specific integrations and must be
registered explicitly; no model or provider is hard-coded into the LIMS.
"""

from abc import ABC, abstractmethod
import json
import os
from urllib import error, request

from django.conf import settings


class AIService(ABC):
    @abstractmethod
    def explain_report(self, *, report_data, patient_context=None):
        """Return a patient-safe explanation of an approved report."""

    @abstractmethod
    def answer_patient_question(self, *, question, patient_context=None):
        """Return general laboratory guidance, not a diagnosis."""


class UnconfiguredAIService(AIService):
    """Safe default used until a vetted provider is configured."""

    def explain_report(self, *, report_data, patient_context=None):
        raise RuntimeError("AI report explanation is not configured.")

    def answer_patient_question(self, *, question, patient_context=None):
        raise RuntimeError("AI patient assistant is not configured.")


class OpenAIService(AIService):
    """Small Responses API client with no mandatory third-party SDK dependency."""

    endpoint = "https://api.openai.com/v1/responses"

    def _respond(self, instructions, content):
        api_key = settings.OPENAI_API_KEY
        if not api_key:
            raise RuntimeError("AI report explanation is not configured.")
        payload = json.dumps({
            "model": settings.OPENAI_MODEL,
            "instructions": instructions,
            "input": content,
        }).encode()
        req = request.Request(
            self.endpoint,
            data=payload,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with request.urlopen(req, timeout=settings.OPENAI_TIMEOUT_SECONDS) as response:
                body = json.loads(response.read().decode())
        except error.URLError as exc:
            raise RuntimeError("AI service is temporarily unavailable.") from exc
        text = body.get("output_text")
        if not text:
            raise RuntimeError("AI service returned no explanation.")
        return text

    def explain_report(self, *, report_data, patient_context=None):
        return self._respond(
            "Explain laboratory results in clear, reassuring language. Do not diagnose, prescribe, or replace clinician advice. Encourage follow-up with a qualified clinician for abnormal findings.",
            json.dumps({"report": report_data, "patient_context": patient_context or {}}, default=str),
        )

    def answer_patient_question(self, *, question, patient_context=None):
        return self._respond(
            "Provide general laboratory guidance only. Do not diagnose or prescribe. Direct urgent symptoms to emergency care and encourage clinician follow-up.",
            json.dumps({"question": question, "patient_context": patient_context or {}}, default=str),
        )


def get_ai_service():
    if getattr(settings, "AI_ENABLED", False) and settings.OPENAI_API_KEY:
        return OpenAIService()
    return UnconfiguredAIService()
