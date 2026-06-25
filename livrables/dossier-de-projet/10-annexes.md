# 8. Annexes

> Rappel du PDF : *« N'inclus ton code en annexe que si ce dernier illustre une difficulté ou une utilisation innovante dont tu es fier. Commente-le pour qu'il soit facilement compréhensible par le jury. »*

## Annexe A — Modèles de données

- **MCD** — Modèle Conceptuel de Données : `docs/modeles/mcd.png`
- **MLD** — Modèle Logique de Données : `docs/modeles/mld.png`
- **MPD** — Modèle Physique de Données : `docs/modeles/mpd.png`

## Annexe B — Configuration multi-environnement de la base de données

*Difficulté illustrée : permettre un développement local (SQLite) et une production robuste (PostgreSQL/Supabase) sans modifier le code, en pilotant tout par variables d'environnement.*

```python
# backend/backend/settings.py (extrait commenté)
# Si DB_HOST est défini -> PostgreSQL (Supabase), sinon repli SQLite (dev local).
if os.environ.get("DB_HOST"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "HOST": os.environ["DB_HOST"],
            "PORT": os.environ.get("DB_PORT", "5432"),
            "NAME": os.environ.get("DB_NAME", "postgres"),
            "USER": os.environ["DB_USER"],
            "PASSWORD": os.environ.get("DB_PASSWORD", ""),
            "CONN_MAX_AGE": 600,
            "OPTIONS": {"sslmode": "require"},  # connexion chiffrée obligatoire
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
```

## Annexe C — Authentification : interception et rafraîchissement du jeton JWT

*Utilisation notable : ajout automatique du jeton à chaque requête et rafraîchissement transparent en cas d'expiration.*

`[À COMPLÉTER : insérer l'extrait commenté de pierrine/services/api.ts — intercepteurs axios.]`

## Annexe D — Lecture du signal de la sonde (Bluetooth BLE)

*Difficulté illustrée : lecture temps réel d'un capteur et pilotage de l'interface.*

`[À COMPLÉTER : insérer l'extrait commenté de la couche Bluetooth — services/bluetooth.ts / touchSignal.ts.]`

## Annexe E — Firmware de la sonde (ESP32)

*Voir `esp32-perinea/perinea.ino` — extrait commenté du service BLE diffusant la valeur de pression.*

## Annexe F — Jeux d'essais (captures d'écran)

`[À COMPLÉTER : captures d'écran des scénarios de test T1 à T10.]`

## Annexe G — Documents personnels (Dossier Professionnel)

*(Pièces d'identité, diplômes, attestations — voir le Dossier Professionnel, document distinct.)*
