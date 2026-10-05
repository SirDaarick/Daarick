import unittest
import asyncio
import httpx
from app.schemas.assistant import ChatMessage
from app.services.assistant.orchestrator import (
    is_user_asking_pricing,
    is_user_approving_proposal,
    get_intelligent_fallback,
    orchestrate_wiki_turn
)

class TestAssistantFlow(unittest.TestCase):
    def test_pricing_keyword_detection(self):
        self.assertTrue(is_user_asking_pricing("Calcular presupuesto estimado"))
        self.assertTrue(is_user_asking_pricing("¿Cuánto cuesta el bot?"))
        self.assertTrue(is_user_asking_pricing("Quiero una cotización"))
        self.assertTrue(is_user_asking_pricing("¿Cuál es el precio?"))
        self.assertTrue(is_user_asking_pricing("ver el presupuesto"))
        self.assertFalse(is_user_asking_pricing("Tengo una peluquería"))
        self.assertFalse(is_user_asking_pricing("Agendar videollamada de 15 min"))

    def test_fallback_proposal_suggestions(self):
        # A. Propuesta para peluquería al elegir opción 1
        res = get_intelligent_fallback("opcion 1")
        self.assertEqual(res["stage"], "PROPUESTA")
        self.assertIn("Calcular presupuesto estimado", res["suggestions"])
        self.assertIn("Agendar videollamada de 15 min", res["suggestions"])
        self.assertIn("Platicar por WhatsApp", res["suggestions"])

        # B. Cuando el cliente valida o aprueba la propuesta
        approval_res = get_intelligent_fallback("Me gusta la propuesta")
        self.assertEqual(approval_res["stage"], "PROPUESTA")
        self.assertIn("presupuesto estimado", approval_res["reply"].lower())
        self.assertIn("Calcular presupuesto estimado", approval_res["suggestions"])
        self.assertIn("Agendar videollamada de 15 min", approval_res["suggestions"])

    def test_orchestrate_proposal_does_not_force_quote(self):
        async def run_test():
            async with httpx.AsyncClient() as client:
                messages = [
                    ChatMessage(role="user", content="Tengo una estética"),
                    ChatMessage(role="assistant", content="Te preparé 3 opciones...", options=["Opción 1", "Opción 2", "Opción 3"]),
                    ChatMessage(role="user", content="Me gusta la opción 1")
                ]
                resp = await orchestrate_wiki_turn(client, messages)
                self.assertEqual(resp.stage, "PROPUESTA")
                # La cotización NO debe ser forzada ni obligatoria en la propuesta inicial
                self.assertIsNone(resp.quotation_action)
                self.assertIn("Calcular presupuesto estimado", resp.suggestions)
                self.assertIn("Agendar videollamada de 15 min", resp.suggestions)
        asyncio.run(run_test())

    def test_orchestrate_explicit_quote_request(self):
        async def run_test():
            async with httpx.AsyncClient() as client:
                messages = [
                    ChatMessage(role="user", content="Tengo una clínica"),
                    ChatMessage(role="assistant", content="La solución sería un asistente..."),
                    ChatMessage(role="user", content="Calcular presupuesto estimado")
                ]
                resp = await orchestrate_wiki_turn(client, messages)
                self.assertEqual(resp.stage, "PROPUESTA")
                # Al solicitar cotización, el servidor SÍ debe construir quotation_action
                self.assertIsNotNone(resp.quotation_action)
                self.assertGreater(resp.quotation_action.setup_price_estimated, 0)
                self.assertGreater(resp.quotation_action.monthly_retainer_estimated, 0)
                self.assertIn("Agendar videollamada de 15 min", resp.suggestions)
        asyncio.run(run_test())

    def test_orchestrate_direct_booking_skips_quote(self):
        async def run_test():
            async with httpx.AsyncClient() as client:
                messages = [
                    ChatMessage(role="user", content="Tengo una clínica"),
                    ChatMessage(role="assistant", content="La solución sería un asistente..."),
                    ChatMessage(role="user", content="Agendar videollamada de 15 min")
                ]
                resp = await orchestrate_wiki_turn(client, messages)
                self.assertEqual(resp.stage, "CIERRE")
                self.assertIsNone(resp.quotation_action)
                self.assertIsNotNone(resp.booking_action)
        asyncio.run(run_test())

if __name__ == "__main__":
    unittest.main()
