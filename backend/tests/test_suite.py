"""
ForensIQ Automated Test Suite — Production Validation
Tests core algorithms, security hashing, ML services, parsers, and API endpoints.
"""
import unittest
import asyncio
import os
import tempfile
from pathlib import Path

# Set PYTHONPATH to include backend
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.hashing import hash_bytes, hash_file, verify_file, chain_hash
from services.ml.risk_scorer import WEIGHTS, ENTITY_BASE_RISK
from services.graph.algorithms import detect_communities, find_shortest_path
from services.ingestion.email_parser import parse_email_file, IP_PATTERN, URL_PATTERN


class TestForensicHashing(unittest.TestCase):
    def test_hash_bytes(self):
        data = b"forensic evidence data"
        h = hash_bytes(data)
        self.assertEqual(len(h), 64)
        self.assertEqual(h, hash_bytes(data))

    def test_hash_file_and_verify(self):
        with tempfile.NamedTemporaryFile(delete=False) as f:
            f.write(b"confidential offshore wire records")
            f_path = f.name
        try:
            h = hash_file(f_path)
            self.assertTrue(verify_file(f_path, h))
            self.assertFalse(verify_file(f_path, "invalid_hash_00000000000000000000000000000000000000000000000000000000"))
        finally:
            os.unlink(f_path)

    def test_chain_hash(self):
        genesis = "0" * 64
        block1 = chain_hash(genesis, "Evidence #1 uploaded by Agent Smith")
        block2 = chain_hash(block1, "Evidence #1 analyzed by AI")
        self.assertEqual(len(block1), 64)
        self.assertEqual(len(block2), 64)
        self.assertNotEqual(block1, block2)


class TestRiskScoring(unittest.TestCase):
    def test_risk_weights_sum(self):
        total_weight = sum(WEIGHTS.values())
        self.assertAlmostEqual(total_weight, 1.0, places=2)

    def test_entity_base_risk(self):
        self.assertIn("ip", ENTITY_BASE_RISK)
        self.assertGreater(ENTITY_BASE_RISK["ip"], 0.0)

    def test_regex_extractors(self):
        text = "Visit http://malicious-domain.com from IP 192.168.1.50"
        ips = IP_PATTERN.findall(text)
        urls = URL_PATTERN.findall(text)
        self.assertIn("192.168.1.50", ips)

from services.ml.anomaly import run_anomaly_detection, ML_AVAILABLE


class TestAnomalyDetection(unittest.TestCase):
    def test_ml_flag(self):
        self.assertIsInstance(ML_AVAILABLE, bool)


class TestGraphAlgorithms(unittest.IsolatedAsyncioTestCase):
    async def test_detect_communities_fallback(self):
        communities = await detect_communities("test-case-id")
        self.assertIsInstance(communities, list)

    async def test_find_shortest_path_fallback(self):
        paths = await find_shortest_path("test-case-id", "entity-1", "entity-2")
        self.assertIsInstance(paths, list)


class TestEmailParser(unittest.TestCase):
    def test_parse_email(self):
        raw_email = (
            b"From: whistleblower@secure.org\n"
            b"To: investigator@forensiq.ai\n"
            b"Subject: Shell accounts inquiry\n"
            b"Date: Sun, 13 Sep 2026 09:00:00 +0000\n\n"
            b"Please look into transfers to offshore account 9876543210 and IP 10.0.0.5."
        )
        with tempfile.NamedTemporaryFile(delete=False, suffix=".eml") as f:
            f.write(raw_email)
            f_path = f.name
        try:
            result = parse_email_file(f_path)
            self.assertEqual(result["from"]["address"], "whistleblower@secure.org")
            self.assertEqual(result["subject"], "Shell accounts inquiry")
            self.assertIn("headers", result)
        finally:
            os.unlink(f_path)


class TestAsyncAPI(unittest.IsolatedAsyncioTestCase):
    async def test_api_live(self):
        import httpx
        from main import app
        from core.database import engine, Base

        # Ensure database tables exist
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            # 1. Root
            root_res = await client.get("/")
            self.assertEqual(root_res.status_code, 200)

            # 2. Health
            health_res = await client.get("/api/health")
            self.assertEqual(health_res.status_code, 200)
            self.assertEqual(health_res.json()["status"], "healthy")

            # 3. Create Case
            create_res = await client.post("/api/cases", json={
                "title": "Automated Test Case",
                "description": "Production verification suite",
                "priority": "critical",
            })
            self.assertEqual(create_res.status_code, 201)
            case_id = create_res.json()["id"]

            try:
                # 4. Read Case
                read_res = await client.get(f"/api/cases/{case_id}")
                self.assertEqual(read_res.status_code, 200)
                self.assertEqual(read_res.json()["title"], "Automated Test Case")

                # 5. AI Investigation Mock
                ai_res = await client.post(f"/api/ai/investigate/{case_id}", json={
                    "question": "What are the primary risk indicators?"
                })
                self.assertEqual(ai_res.status_code, 200)
                self.assertIn("reasoning", ai_res.json())

                # 6. Generate Report
                rep_res = await client.post(f"/api/reports/generate/{case_id}", json={
                    "format": "json"
                })
                self.assertIn(rep_res.status_code, (200, 201))

            finally:
                # 7. Cleanup
                del_res = await client.delete(f"/api/cases/{case_id}")
                self.assertEqual(del_res.status_code, 204)


if __name__ == "__main__":
    unittest.main()
