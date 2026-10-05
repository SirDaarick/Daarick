"""
Tests unitarios del servicio de cálculo determinista de cotizaciones en MXN y USD.
"""
import unittest
from app.services.calculator_service import calculate_quote, CATALOG
from app.schemas.calculator import ClientBleedInputsSchema, DeveloperConfigSchema

class TestCalculatorService(unittest.TestCase):
    def test_catalog_integrity(self):
        self.assertGreaterEqual(len(CATALOG), 5)
        ids = [item.id for item in CATALOG]
        self.assertIn("ai-sales-bot", ids)
        self.assertIn("calendar-sync", ids)

    def test_floor_cost_boundary_mxn(self):
        bleed = ClientBleedInputsSchema(
            lost_hours_per_week=0,
            hourly_labor_cost=0,
            average_ticket_value=0,
            monthly_leads_or_clients=0,
            lost_clients_percentage=0,
            human_errors_monthly_cost=0
        )
        dev_config = DeveloperConfigSchema(erick_hourly_rate=13.0, exchange_rate_usd_to_mxn=18.5)
        quote = calculate_quote(["ai-sales-bot"], bleed=bleed, dev_config=dev_config, currency="MXN")

        # ai-sales-bot: 24 hrs + 6 platform + 4 meetings = 34 hrs * ($13 USD * 18.5 = $240.5) = $8,177 MXN
        self.assertEqual(quote.total_automation_hours, 24)
        self.assertEqual(quote.total_project_hours, 34)
        self.assertEqual(quote.technical_floor_cost, 8177.0)
        self.assertEqual(quote.recommended_setup_price, 8177.0)

    def test_value_pricing_and_roi_mxn(self):
        bleed = ClientBleedInputsSchema(
            lost_hours_per_week=15,
            hourly_labor_cost=200, # $200 MXN/hr
            average_ticket_value=3500, # $3500 MXN ticket
            monthly_leads_or_clients=30,
            lost_clients_percentage=20,
            human_errors_monthly_cost=3000
        )
        quote = calculate_quote(["ai-sales-bot", "calendar-sync"], bleed=bleed, currency="MXN")

        self.assertGreater(quote.recommended_setup_price, quote.technical_floor_cost)
        self.assertGreater(quote.year_one_net_savings, 0)
        self.assertGreater(quote.roi_percentage, 50)
        self.assertEqual(len(quote.monthly_breakdown), 12)
        self.assertEqual(quote.currency, "MXN")

if __name__ == "__main__":
    unittest.main()
