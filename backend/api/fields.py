"""Champs chiffrés au repos pour les données de santé (RGPD art. 9 / art. 32).

Chiffrement symétrique authentifié (Fernet : AES-128-CBC + HMAC-SHA256).
Clés : variable FIELD_ENCRYPTION_KEYS (liste séparée par des virgules, la première
sert à chiffrer, les suivantes seulement à déchiffrer -> rotation de clé possible).

⚠️ Perdre la clé = perdre définitivement les données chiffrées.
"""
from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

from cryptography.fernet import Fernet, InvalidToken, MultiFernet
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import models


PREFIX = "enc:v1:"


@lru_cache(maxsize=1)
def _cipher() -> MultiFernet:
    keys = list(getattr(settings, "FIELD_ENCRYPTION_KEYS", []) or [])
    if not keys:
        raise ImproperlyConfigured("FIELD_ENCRYPTION_KEYS n'est pas configuré.")
    return MultiFernet([Fernet(key.encode() if isinstance(key, str) else key) for key in keys])


def encrypt_str(value: str) -> str:
    return PREFIX + _cipher().encrypt(value.encode("utf-8")).decode("ascii")


def decrypt_str(value: str) -> str:
    if not value.startswith(PREFIX):
        return value  # donnée historique encore en clair : relue telle quelle, rechiffrée à la prochaine sauvegarde
    try:
        return _cipher().decrypt(value[len(PREFIX):].encode("ascii")).decode("utf-8")
    except InvalidToken as exc:
        raise ImproperlyConfigured("Impossible de déchiffrer un champ : clé FIELD_ENCRYPTION_KEYS incorrecte.") from exc


class EncryptedTextField(models.TextField):
    def from_db_value(self, value: Any, expression, connection) -> Any:
        if value is None:
            return value
        return decrypt_str(value)

    def to_python(self, value: Any) -> Any:
        if isinstance(value, str) and value.startswith(PREFIX):
            return decrypt_str(value)
        return value

    def get_prep_value(self, value: Any) -> Any:
        value = super().get_prep_value(value)
        if value is None:
            return value
        return encrypt_str(str(value))


class EncryptedJSONField(models.TextField):
    """Valeur JSON (liste, dict…) sérialisée puis chiffrée, stockée en texte."""

    def from_db_value(self, value: Any, expression, connection) -> Any:
        if value is None:
            return value
        return self._load(decrypt_str(value))

    def to_python(self, value: Any) -> Any:
        if isinstance(value, str):
            return self._load(decrypt_str(value))
        return value

    def get_prep_value(self, value: Any) -> Any:
        if value is None:
            return value
        return encrypt_str(json.dumps(value, ensure_ascii=False))

    @staticmethod
    def _load(raw: str) -> Any:
        if raw == "":
            return []
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return []
