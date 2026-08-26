from django.test import SimpleTestCase


class HealthEndpointTests(SimpleTestCase):
    def test_health_returns_ok_json(self) -> None:
        response = self.client.get("/api/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_missing_api_route_returns_contract_error(self) -> None:
        response = self.client.get("/api/missing")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["code"], "NOT_FOUND")
        self.assertEqual(response.json()["message"], "请求的接口不存在")

    def test_health_rejects_post_with_contract_error(self) -> None:
        response = self.client.post("/api/health", data={}, content_type="application/json")

        self.assertEqual(response.status_code, 405)
        self.assertEqual(response.json()["code"], "METHOD_NOT_ALLOWED")
        self.assertEqual(response.json()["message"], "不支持该请求方法")
