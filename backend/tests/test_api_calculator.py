"""
Test de integración para el endpoint /api/v1/calculator/quote
"""
import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestCalculatorAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_get_catalog(self):
        response = self.client.get("/api/v1/calculator/catalog")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data), 5)
        self.assertTrue(any(item["id"] == "ai-sales-bot" for item in data))

    def test_post_quote(self):
        payload = {
            "selected_automation_ids": ["ai-sales-bot", "calendar-sync"],
            "bleed_inputs": {
                "lost_hours_per_week": 15,
                "hourly_labor_cost": 20,
                "average_ticket_value": 300,
                "monthly_leads_or_clients": 50,
                "lost_clients_percentage": 25,
                "human_errors_monthly_cost": 300
            },
            "currency": "USD"
        }
        response = self.client.post("/api/v1/calculator/quote", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("recommended_setup_price", data)
        self.assertIn("roi_percentage", data)
        self.assertIn("monthly_breakdown", data)
        self.assertEqual(len(data["monthly_breakdown"]), 12)
        self.assertGreater(data["recommended_setup_price"], 0)
        self.assertGreater(data["roi_percentage"], 0)

if __name__ == "__main__":
    unittest.main()
