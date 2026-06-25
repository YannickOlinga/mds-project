# 4. Compte rendu de la production

## 4.1. Architecture générale de l'application

L'application repose sur une architecture **client / serveur** avec une couche matérielle :

```
┌────────────────┐   BLE    ┌──────────────────────┐  HTTPS/REST  ┌────────────────┐   SQL   ┌──────────────────┐
│  Sonde ESP32   │ ───────► │  App mobile (Expo/RN) │ ───────────► │  API Django    │ ──────► │ PostgreSQL        │
│  capteur press.│          │  expo-router, Zustand │   (JWT)      │  REST Framework│         │ (Supabase)        │
└────────────────┘          └──────────────────────┘              └────────────────┘         └──────────────────┘
```

- Le **front mobile** ne contient aucune logique métier sensible : il consomme l'API REST et stocke les jetons d'authentification de façon sécurisée (expo-secure-store).
- Le **back-end** centralise la logique, la validation et l'accès aux données.
- La **sonde** envoie un signal de pression lu en Bluetooth, exploité localement par les écrans d'exercice et de jeu.

**Arborescence simplifiée du projet :**

```
mds-project/
├── backend/                # API Django REST
│   ├── api/                # modèles, vues, sérialiseurs, urls
│   ├── backend/            # configuration (settings, urls, wsgi)
│   └── requirements.txt
├── pierrine/               # Application mobile Expo / React Native
│   ├── app/                # écrans (expo-router)
│   ├── services/           # accès API, auth, Bluetooth, Supabase
│   ├── store/              # état global (Zustand)
│   └── components/         # composants réutilisables
├── esp32-perinea/          # firmware de la sonde (ESP32)
├── supabase/               # schéma SQL et données de référence
└── docs/modeles/           # MCD / MLD / MPD
```

## 4.2. Conception de la base de données

La base a été modélisée selon la méthode **Merise** (MCD → MLD → MPD). Les trois modèles sont fournis en images dans `docs/modeles/` ([mcd.png](../../docs/modeles/mcd.png), [mld.png](../../docs/modeles/mld.png), [mpd.png](../../docs/modeles/mpd.png)).

**Entités principales :**

| Table | Rôle | Relations |
|---|---|---|
| `auth_user` | Compte utilisateur (authentification) | 1–1 avec `profile` |
| `api_profile` | Profil métier (niveau, objectif, symptômes, préférences) | lié à l'utilisateur |
| `api_devicestatus` | État de la sonde (batterie, signal, connexion) | 1–1 avec `profile` |
| `api_session` | Historique d'une séance réalisée | N–1 avec `profile` |
| `api_userachievement` | Succès débloqués par l'utilisateur | N–N `profile` ↔ `achievement` |
| `api_exercisetemplate` | Catalogue d'exercices (par niveau) | autonome (référentiel) |
| `api_sessiontemplate` | Modèles de séances | autonome (référentiel) |
| `api_tiptemplate` | Conseils affichés | autonome (référentiel) |
| `api_achievementtemplate` | Catalogue des succès possibles | référencé par `userachievement` |

**Choix de conception :**
- Séparation **données utilisateur** (avec relations) / **données de référence** (catalogues autonomes), pour faciliter l'alimentation du contenu sans impacter les comptes.
- Champ `symptoms` en **JSONB** (liste flexible) plutôt qu'une table dédiée, le besoin étant une simple liste de cases cochées.
- Énumération `level_key` (`debutant` / `intermediaire` / `avance`) contrôlée au niveau du modèle.

**Migration de la base :** initialement en **SQLite** pour le développement, la base a été migrée vers **PostgreSQL hébergé sur Supabase** pour la production. Les données existantes (17 utilisateurs, 50 séances, etc.) ont été exportées (`dumpdata`) puis réimportées (`loaddata`) après création du schéma par les migrations Django. La connexion utilise le *Session pooler* (compatible IPv4) avec SSL obligatoire.

## 4.3. Développement du back-end (API Django REST)

L'API expose des points d'entrée REST sécurisés. Exemples (extrait de `pierrine/services/endpoints.ts`, côté consommateur) :

| Méthode | Endpoint | Rôle |
|---|---|---|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion (renvoie les jetons JWT) |
| GET | `/api/home/dashboard` | Données du tableau de bord |
| GET | `/api/device/status` | État de la sonde |
| POST | `/api/device/connect` | Connexion de la sonde |
| GET | `/api/training/program` | Programme d'entraînement |
| GET | `/api/progress` | Progression et statistiques |

L'authentification s'appuie sur **JSON Web Tokens** : un intercepteur côté mobile ajoute automatiquement le jeton aux requêtes et gère son rafraîchissement.

**Cycle d'une requête authentifiée :**

```
1. L'utilisateur se connecte -> l'API renvoie un couple (access, refresh).
2. Le jeton "access" est stocké de façon sécurisée (expo-secure-store).
3. Chaque requête protégee envoie l'en-tete  Authorization: Bearer <access>.
4. Si l'access est expiré (401), l'intercepteur utilise le "refresh"
   pour obtenir un nouveau jeton, puis rejoue la requete de maniere transparente.
5. Si le refresh est invalide -> deconnexion et retour a l'ecran de login.
```

## 4.4. Développement du front-end mobile (Expo / React Native)

Application **TypeScript** structurée avec **expo-router** (routage par fichiers). Principaux écrans :

- **Entrée & auth** : `index` (splash vidéo), `onboarding`, `login`, `register`, `questionnaire` ;
- **Sonde** : `connect`, `connected`, `device-settings` ;
- **Exercices & jeux** : `guided-exercise`, `free-mode`, `game-hub`, `game-bulles`, `game-eclipse`, `game-source`, `session-complete` ;
- **Onglets principaux** : `index` (accueil), `training`, `progress`, `challenges`, `profile`.

Choix techniques notables :
- **Zustand** pour l'état global (session d'authentification) ;
- **React Query** pour le cache et la synchronisation des données serveur ;
- **react-native-reanimated** pour les animations des jeux ;
- **expo-secure-store** pour le stockage sécurisé des jetons ;
- **expo-video** pour la vidéo de démarrage de l'application.

## 4.5. Intégration du matériel connecté (sonde ESP32 / Bluetooth)

La sonde, pilotée par un **ESP32** (firmware dans `esp32-perinea/perinea.ino`), expose un service **BLE** diffusant la valeur de pression. Côté mobile, la librairie **react-native-ble-plx** gère le scan, l'appairage et l'abonnement aux notifications. Le signal reçu est normalisé puis utilisé pour piloter les exercices et les mini-jeux (ex. l'intensité de contraction fait monter une bulle à l'écran).

Points d'attention gérés : permissions Bluetooth/localisation (Android), reconnexion automatique, état de connexion affiché à l'utilisateur (`api_devicestatus`).

## 4.6. Extraits de code significatifs

Les extraits de code les plus représentatifs (configuration multi-environnement de la base, intercepteur JWT, lecture du signal BLE, logique d'un mini-jeu) sont commentés en **annexe** (voir [10-annexes.md](10-annexes.md)), conformément à la recommandation du PDF : *« N'inclus ton code en annexe que si ce dernier illustre une difficulté ou une utilisation innovante. »*
