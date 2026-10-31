"""QA legado de interface da loja BomVizinho. Executar com: npm run test:browser
Os testes usam servidor estático e respostas de API simuladas; não acessam produção,
não registram pedidos reais e não alteram o banco D1.
"""
import os
import threading
import unittest
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from functools import partial

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "rommo-site"
HOST = "127.0.0.1"
PORT = 8765
PRODUCTS = {"products": [
    {"id": 901, "name": "Produto QA Parafusadeira", "title": "Produto QA Parafusadeira",
     "category": "eletricas", "price": 99.9, "original_price": 129.9,
     "active": True, "image": "assets/produtos/1.png", "description": "Produto fictício para teste"}
]}

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

class BomVizinhoQA(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        handler = partial(QuietHandler, directory=str(SITE))
        cls.server = ThreadingHTTPServer((HOST, PORT), handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.pw = sync_playwright().start()
        browser_path = os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE", "/usr/bin/chromium")
        launch_options = {"headless": True}
        if os.path.exists(browser_path):
            launch_options["executable_path"] = browser_path
        cls.browser = cls.pw.chromium.launch(**launch_options)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()
        cls.server.shutdown()
        cls.server.server_close()

    def setUp(self):
        self.page = self.browser.new_page(viewport={"width": 1365, "height": 900})
        self.page_errors = []
        self.page.on("pageerror", lambda error: self.page_errors.append(str(error)))
        self.page.route("**/api/**", self._mock_api)

    def tearDown(self):
        self.page.close()

    @staticmethod
    def _mock_api(route):
        url = route.request.url
        if url.endswith("/api/admin/me"):
            route.fulfill(status=401, content_type="application/json", body='{"error":"Não autenticado"}')
        elif url.endswith("/api/admin/login"):
            route.fulfill(status=401, content_type="application/json", body='{"error":"Credenciais inválidas"}')
        else:
            route.fulfill(status=200, content_type="application/json", body='{"ok":true,"products":[]}')

    def open_store(self):
        response = self.page.goto(f"http://{HOST}:{PORT}/index.html", wait_until="domcontentloaded")
        self.assertIsNotNone(response)
        self.assertEqual(response.status, 200)

    def test_01_store_loads(self):
        self.open_store()
        self.assertIn("BomVizinho", self.page.title())
        self.assertTrue(self.page.locator("body").is_visible())
        self.assertTrue(self.page.locator("#grid").count() == 1)

    def test_02_catalog_has_products_without_api(self):
        self.open_store()
        self.page.wait_for_timeout(500)
        # O catálogo local é o fallback esperado quando a API responde sem produtos.
        self.assertGreater(self.page.locator("#grid article").count(), 0)

    def test_03_cart_add_and_modal_repeatedly(self):
        self.open_store()
        add_button = self.page.locator("#grid button", has_text="Adicionar ao carrinho").first
        self.assertTrue(add_button.is_visible())
        for _ in range(3):
            add_button.click()
            self.page.locator("#md.on").wait_for(state="visible")
            self.page.get_by_role("button", name="Continuar comprando").click()
            self.page.wait_for_timeout(100)
            self.assertFalse(self.page.locator("#md").evaluate("(e)=>e.classList.contains('on')"))
        self.assertGreaterEqual(self.page.locator(".cnt").first.inner_text().strip() != "0", True)

    def test_04_cart_opens_and_closes_repeatedly(self):
        self.open_store()
        for _ in range(3):
            self.page.get_by_role("button", name="Carrinho").first.click()
            self.page.locator("#dr.on").wait_for(state="visible")
            self.page.get_by_role("button", name="Fechar").click()
            self.page.wait_for_timeout(80)
            self.assertFalse(self.page.locator("#dr").evaluate("(e)=>e.classList.contains('on')"))

    def test_05_checkout_does_not_open_with_empty_cart(self):
        self.open_store()
        self.page.evaluate("openCheckout()")
        self.page.wait_for_timeout(100)
        self.assertFalse(self.page.locator("#ck").evaluate("(e)=>e.classList.contains('on')"))

    def test_06_admin_login_screen_loads(self):
        response = self.page.goto(f"http://{HOST}:{PORT}/gestao-6f2a/", wait_until="domcontentloaded")
        self.assertIsNotNone(response)
        self.assertEqual(response.status, 200)
        self.page.locator("#login").wait_for(state="visible", timeout=5000)
        self.assertTrue(self.page.locator('input[name="email"]').is_visible())
        self.assertTrue(self.page.locator('input[name="password"]').is_visible())

    def test_07_admin_rejects_fake_credentials(self):
        self.page.goto(f"http://{HOST}:{PORT}/gestao-6f2a/", wait_until="domcontentloaded")
        self.page.locator("#login").wait_for(state="visible", timeout=5000)
        self.page.locator('input[name="email"]').fill("qa@example.invalid")
        self.page.locator('input[name="password"]').fill("senha-ficticia-para-teste")
        self.page.locator("#go").click()
        self.page.wait_for_timeout(300)
        self.assertTrue(self.page.locator("#login").is_visible())
        self.assertFalse(self.page.locator("#app").inner_text().strip() == "")

    def test_08_no_uncaught_browser_errors_on_store(self):
        self.open_store()
        self.page.wait_for_timeout(700)
        self.assertEqual(self.page_errors, [], "Erros JavaScript: " + " | ".join(self.page_errors))

    def test_09_mobile_store_layout_renders(self):
        self.page.set_viewport_size({"width": 390, "height": 844})
        self.open_store()
        self.assertTrue(self.page.locator("body").is_visible())
        self.assertGreater(self.page.locator("#grid article").count(), 0)
        width = self.page.locator("body").evaluate("(e)=>e.scrollWidth")
        self.assertLessEqual(width, 430, f"Possível overflow horizontal: body.scrollWidth={width}px")

    def test_10_worker_has_expected_api_routes(self):
        worker = (ROOT / "worker" / "index.js").read_text(encoding="utf-8")
        for route in ("/api/health", "/api/products", "/api/orders",
                      "/api/admin/login", "/api/admin/logout", "/api/admin/products",
                      "/api/admin/settings", "/api/admin/orders", "/api/admin/summary",
                      "/api/customer/register", "/api/customer/login",
                      "/api/customer/logout", "/api/customer/cart",
                      "/api/admin/abandoned-carts"):
            with self.subTest(route=route):
                self.assertIn(route, worker)

if __name__ == "__main__":
    unittest.main(verbosity=2)
