from unittest.mock import patch
from django.test import SimpleTestCase, override_settings
from common.services.ai import OpenAIService, get_ai_service, UnconfiguredAIService

class AIServiceTests(SimpleTestCase):
    @override_settings(AI_ENABLED=False, OPENAI_API_KEY="")
    def test_unconfigured_service_is_safe_default(self):
        self.assertIsInstance(get_ai_service(), UnconfiguredAIService)

    @override_settings(AI_ENABLED=True, OPENAI_API_KEY="test-key")
    @patch("common.services.ai.request.urlopen")
    def test_openai_service_extracts_response_text(self, urlopen):
        response = urlopen.return_value.__enter__.return_value
        response.read.return_value = b'{"output_text":"Patient-safe explanation"}'
        self.assertEqual(OpenAIService().explain_report(report_data={"results": []}), "Patient-safe explanation")
