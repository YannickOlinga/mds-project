# 3. Plan de gestion du projet

## 3.1. Méthodologie

Le projet a été mené selon une approche **agile itérative** (cycles courts), adaptée à un développeur seul / petite équipe : livraison de fonctionnalités par incréments, tests au fil de l'eau, ajustements réguliers.

`[À COMPLÉTER : préciser la durée réelle du projet, le rythme des itérations, les éventuels points de suivi avec le tuteur.]`

## 3.2. Découpage en lots et planning

| Lot | Contenu | Livrable |
|---|---|---|
| **L0 — Cadrage** | Analyse du besoin, choix techniques, modélisation BDD | MCD / MLD / MPD, specs |
| **L1 — Back-end** | Modèles Django, API REST, authentification JWT | API fonctionnelle |
| **L2 — Front Auth & Onboarding** | Inscription, connexion, questionnaire de profilage | Parcours d'entrée |
| **L3 — Sonde & Bluetooth** | Appairage BLE, lecture du signal | Connexion sonde |
| **L4 — Exercices & Jeux** | Séances guidées, mini-jeux pilotés par la sonde | Cœur fonctionnel |
| **L5 — Suivi & Profil** | Statistiques, progression, succès, préférences | Tableau de bord |
| **L6 — Industrialisation** | Migration BDD vers PostgreSQL/Supabase, déploiement | Mise en production |

*(Un diagramme de Gantt peut être ajouté en annexe — voir `[À COMPLÉTER]`.)*

## 3.3. Outils de gestion et de versionnement

- **Versionnement** : Git + GitHub (`YannickOlinga/mds-project`), travail par branches (ex. `init-frontend`).
- **Gestion des tâches** : `[À COMPLÉTER : Trello / GitHub Projects / Notion...]`.
- **Communication** : `[À COMPLÉTER]`.

## 3.4. Environnements

| Environnement | Base de données | Usage |
|---|---|---|
| **Développement** | SQLite (local, repli automatique) | Itérations rapides hors-ligne |
| **Production** | PostgreSQL hébergé sur Supabase | Données réelles, accès distant |

Le basculement entre les deux est piloté par variables d'environnement (`.env`), sans modification du code : si `DB_HOST` est défini, Django se connecte à PostgreSQL ; sinon, repli sur SQLite. Cette conception facilite le développement local tout en garantissant une production robuste.

**Organisation du dépôt :**
```
mds-project/
├── backend/        # API Django REST + configuration
├── pierrine/       # Application mobile Expo / React Native
├── esp32-perinea/  # Firmware de la sonde connectée (ESP32)
├── supabase/       # Schéma SQL et données de référence
└── docs/modeles/   # Modèles de données MCD / MLD / MPD
```
