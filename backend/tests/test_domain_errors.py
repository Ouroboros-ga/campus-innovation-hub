"""领域异常必须转换为 APIContract 约定的 HTTP 响应。"""

from django.test import SimpleTestCase

from apps.core.errors import api_exception_handler
from apps.domain_errors import CapacityFull, PermissionDenied


class DomainErrorHandlerTests(SimpleTestCase):
    def test_domain_error_uses_its_contract_code_and_status(self) -> None:
        response = api_exception_handler(CapacityFull(), {})

        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.data, {"code": "CAPACITY_FULL", "message": "容量已满。"})

    def test_permission_domain_error_is_not_an_unhandled_500(self) -> None:
        response = api_exception_handler(PermissionDenied(), {})

        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["code"], "PERMISSION_DENIED")
