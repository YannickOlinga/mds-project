from django.core.cache import cache
from rest_framework.test import APITestCase

from .models import Profile, Session


STRONG_PASSWORD = "Pl4ncher-Pelvien!42"


class SecurityTests(APITestCase):
    def setUp(self) -> None:
        cache.clear()  # remet les compteurs de throttling à zéro

    def register(self, username="alice", password=STRONG_PASSWORD):
        return self.client.post(
            "/api/auth/register",
            {"username": username, "email": f"{username}@example.com", "password": password},
            format="json",
        )

    def auth(self, username="alice"):
        data = self.register(username).json()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {data['access']}")
        return data

    def test_weak_password_rejected(self):
        self.assertEqual(self.register(password="12345678").status_code, 400)
        self.assertEqual(self.register(password="password").status_code, 400)

    def test_username_case_insensitive_uniqueness(self):
        self.assertEqual(self.register("alice").status_code, 201)
        self.assertEqual(self.register("ALICE").status_code, 400)

    def test_endpoints_require_auth(self):
        for url in ["/api/home/dashboard", "/api/me/profile", "/api/stats/progress"]:
            self.assertEqual(self.client.get(url).status_code, 401, url)

    def test_logout_blacklists_refresh_token(self):
        data = self.auth()
        self.assertEqual(
            self.client.post("/api/auth/logout", {"refresh": data["refresh"]}, format="json").status_code, 204
        )
        self.client.credentials()
        resp = self.client.post("/api/auth/refresh", {"refresh": data["refresh"]}, format="json")
        self.assertEqual(resp.status_code, 401)

    def test_refresh_rotation_revokes_old_token(self):
        data = self.register().json()
        first = self.client.post("/api/auth/refresh", {"refresh": data["refresh"]}, format="json")
        self.assertEqual(first.status_code, 200)
        replay = self.client.post("/api/auth/refresh", {"refresh": data["refresh"]}, format="json")
        self.assertEqual(replay.status_code, 401)

    def test_cannot_logout_other_users_token(self):
        bob = self.register("bob").json()
        self.auth("alice")
        resp = self.client.post("/api/auth/logout", {"refresh": bob["refresh"]}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_malformed_payloads_return_400_not_500(self):
        self.auth()
        cases = [
            ("/api/device/connect", {"device_name": "x", "battery_pct": "abc"}),
            ("/api/device/connect", {"device_name": "x", "battery_pct": 999}),
            ("/api/training/complete", {"level_key": ["debutant"]}),
            ("/api/training/complete", {"level_key": "debutant", "exercises_count": "lots"}),
            ("/api/training/complete", {"level_key": "debutant", "exercises_count": 10**9}),
            ("/api/device/connect", ["not", "an", "object"]),
        ]
        for url, body in cases:
            self.assertEqual(self.client.post(url, body, format="json").status_code, 400, (url, body))
        self.assertEqual(
            self.client.put("/api/me/profile", {"health_notes": "x" * 5000}, format="json").status_code, 400
        )
        self.assertEqual(
            self.client.put("/api/me/profile", {"symptoms": ["a"] * 100}, format="json").status_code, 400
        )

    def test_string_false_is_parsed_as_false(self):
        self.auth()
        resp = self.client.put("/api/me/profile", {"reminders": "false"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(resp.json()["settings"]["reminders"])

    def test_profile_update_does_not_reset_other_settings(self):
        self.auth()
        self.client.put("/api/me/profile", {"darkMode": True}, format="json")
        resp = self.client.put("/api/me/profile", {"name": "Alice"}, format="json")
        self.assertTrue(resp.json()["settings"]["darkMode"])

    def test_data_isolation_between_users(self):
        self.auth("alice")
        self.client.post("/api/training/complete", {"level_key": "debutant"}, format="json")
        self.auth("bob")
        self.assertEqual(self.client.get("/api/stats/progress").json()["overall"]["sessions_total"], 0)

    def test_delete_account_requires_password_and_erases_data(self):
        self.auth()
        self.client.post("/api/training/complete", {"level_key": "debutant"}, format="json")
        self.assertEqual(self.client.post("/api/me/delete", {"password": "wrong"}, format="json").status_code, 403)
        self.assertEqual(
            self.client.post("/api/me/delete", {"password": STRONG_PASSWORD}, format="json").status_code, 204
        )
        self.assertFalse(Profile.objects.exists())
        self.assertFalse(Session.objects.exists())
        self.assertEqual(self.client.get("/api/me/profile").status_code, 401)

    def test_login_is_throttled(self):
        self.register()
        codes = [
            self.client.post("/api/auth/login", {"username": "alice", "password": "bad"}, format="json").status_code
            for _ in range(12)
        ]
        self.assertIn(429, codes)

    def test_health_data_requires_consent(self):
        self.auth()
        resp = self.client.put("/api/me/profile", {"symptoms": ["Fuites"]}, format="json")
        self.assertEqual(resp.status_code, 400)
        resp = self.client.put(
            "/api/me/profile", {"symptoms": ["Fuites"], "health_data_consent": True}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()["health_data_consent"])
        self.assertEqual(resp.json()["profile_fields"]["symptoms"], ["Fuites"])

    def test_consent_withdrawal_erases_health_data(self):
        self.auth()
        self.client.put(
            "/api/me/profile",
            {"health_notes": "note", "symptoms": ["Fuites"], "health_data_consent": True},
            format="json",
        )
        resp = self.client.put("/api/me/profile", {"health_data_consent": False}, format="json")
        body = resp.json()
        self.assertFalse(body["health_data_consent"])
        self.assertEqual(body["profile_fields"]["symptoms"], [])
        self.assertEqual(body["profile_fields"]["health_notes"], "")

    def test_health_data_encrypted_at_rest(self):
        from django.db import connection

        self.auth()
        self.client.put(
            "/api/me/profile", {"health_notes": "secret medical", "health_data_consent": True}, format="json"
        )
        with connection.cursor() as cursor:
            cursor.execute("SELECT health_notes FROM api_profile")
            raw = cursor.fetchone()[0]
        self.assertTrue(raw.startswith("enc:v1:"))
        self.assertNotIn("secret", raw)
