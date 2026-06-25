# Fiches activités types par compétence

> Une fiche par compétence à attester. Chaque fiche est pré-remplie à partir du projet **Périnéa** ; à relire, compléter et illustrer (captures, extraits).
> ⚠️ Aligner les intitulés exacts sur le **REAC en vigueur** de ton centre.

---

## AT1 — Développer une application sécurisée

### C1. Installer et configurer son environnement de travail
**Contexte (Périnéa) :** mise en place de l'environnement de développement complet du projet.
**Réalisé :** configuration d'un environnement Python/Django (venv, dépendances `requirements.txt`), d'un environnement Node/Expo pour le mobile, gestion des versions avec **Git/GitHub**, configuration multi-environnement par variables d'environnement (`.env`).
**Technologies :** Python 3, Django, Node.js, Expo, Git.
**Preuve :** structure du dépôt, fichiers de configuration. `[capture à ajouter]`

### C2. Développer des interfaces utilisateur
**Contexte :** développement de l'application mobile Périnéa.
**Réalisé :** création d'une vingtaine d'écrans (onboarding, authentification, exercices, mini-jeux, statistiques, profil) en **React Native / Expo** avec navigation par fichiers (expo-router) et animations (reanimated).
**Technologies :** React Native, TypeScript, expo-router.
**Preuve :** captures d'écrans, extraits de composants. `[à ajouter]`

### C3. Développer des composants métier
**Contexte :** logique côté serveur de Périnéa.
**Réalisé :** développement de l'API REST (gestion des profils, séances, sonde, progression, succès), validation des données et sérialisation avec **Django REST Framework**.
**Technologies :** Django, DRF.
**Preuve :** modèles, vues, sérialiseurs. `[à ajouter]`

### C4. Contribuer à la gestion d'un projet informatique
**Réalisé :** découpage du projet en lots, suivi via `[À COMPLÉTER : outil]`, versionnement par branches Git, points de suivi avec le tuteur.
**Preuve :** historique Git, planning. `[à ajouter]`

---

## AT2 — Concevoir et développer une application sécurisée organisée en couches

### C5. Analyser les besoins et maquetter une application
**Réalisé :** analyse du besoin (méthode QQOQCP), spécifications fonctionnelles, `[À COMPLÉTER : maquettes / wireframes]`.
**Preuve :** dossier de projet (analyse préalable), maquettes. `[à ajouter]`

### C6. Définir l'architecture logicielle
**Réalisé :** architecture en couches client/serveur + couche matérielle (sonde BLE → app mobile → API REST → base PostgreSQL).
**Preuve :** schéma d'architecture (dossier de projet, §4.1).

### C7. Concevoir et mettre en place une base de données relationnelle
**Réalisé :** modélisation **Merise** (MCD/MLD/MPD), création du schéma via les migrations Django, **migration de SQLite vers PostgreSQL (Supabase)**.
**Technologies :** PostgreSQL, Django ORM, Merise.
**Preuve :** `docs/modeles/` (mcd/mld/mpd.png), scripts de migration.

### C8. Développer des composants d'accès aux données
**Réalisé :** couche d'accès aux données via l'**ORM Django** ; côté mobile, accès aux données serveur via une couche de services (axios) et cache **React Query**.
**Preuve :** extraits de code (`endpoints.ts`, modèles Django).

---

## AT3 — Préparer le déploiement d'une application sécurisée

### C9. Préparer et exécuter les plans de tests
**Réalisé :** jeux d'essais fonctionnels (inscription, connexion, séances, sonde), tests sur appareils réels iOS/Android.
**Preuve :** tableau de tests (dossier de projet, §5.2). `[captures à ajouter]`

### C10. Préparer et documenter le déploiement
**Réalisé :** configuration multi-environnement, sécurisation des secrets, documentation du déploiement et de la migration de base de données.
**Preuve :** documentation, fichiers `.env.example`.

### C11. Contribuer à la mise en production (DevOps)
**Réalisé :** versionnement Git/GitHub, migration de la base vers un hébergement managé (Supabase). `[À COMPLÉTER : CI/CD, hébergement de l'API si réalisé.]`
**Preuve :** dépôt GitHub, base Supabase.

---

> 💡 Pour chaque fiche, le jury attend un **exemple concret et personnel**. Remplace les `[à ajouter]` par tes captures et extraits, et reformule à la première personne (« j'ai réalisé… »).
