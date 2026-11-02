# backend (Django + DRF)

## Prérequis
- Python 3.10+ (dans votre environnement, pensez à vérifier la compatibilité Django)

## Démarrage
0. Copier `.env.example` vers `.env` et mettre `DJANGO_DEBUG=True` pour le dev local
   (sans ça, Django exige `DJANGO_SECRET_KEY` et `DJANGO_ALLOWED_HOSTS`).
1. Installer les dépendances
   ```bash
   pip install -r requirements.txt
   ```
2. Lancer les migrations
   ```bash
   python manage.py makemigrations api
   python manage.py migrate
   ```
3. (Optionnel) Seed des données de démo
   ```bash
   python manage.py seed_demo --profile-id 1
   ```
4. Lancer le serveur
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

## Endpoints principaux
- `POST /api/auth/register` (body: `{ username, email, password }`)
- `POST /api/auth/login` (body: `{ username, password }`) — limité à 10/min/IP
- `POST /api/auth/refresh` (body: `{ refresh }`) — rotation : renvoie un nouveau refresh, l'ancien est révoqué
- `POST /api/auth/logout` (body: `{ refresh }`, authentifié) — révoque le refresh token
- `POST /api/me/delete` (body: `{ password }`, authentifié) — supprime compte + données (RGPD)
- Tous les endpoints ci-dessous nécessitent un `Authorization: Bearer <access_token>`
- `GET /api/home/dashboard`
- `GET /api/device/status`
- `POST /api/device/connect`
- `GET /api/training/program?level_key=debutant`
- `POST /api/training/complete` (body: `{ level_key, exercises_count }`)
- `GET /api/stats/progress`
- `GET /api/me/profile`
- `PUT /api/me/profile` (body: `{ reminders, notifications, darkMode }`)

