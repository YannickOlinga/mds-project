# 5. Tests de conformité et de sécurité

## 5.1. Stratégie de tests

Les tests ont combiné :
- **Tests manuels fonctionnels** sur les parcours critiques (inscription, connexion, séance, jeu, suivi) ;
- **Tests d'intégration API** (vérification des codes de réponse, des données et de l'authentification) ;
- **Tests sur appareils réels** (iOS et Android) pour la connexion Bluetooth de la sonde.

`[À COMPLÉTER : ajouter les tests automatisés réellement écrits, le cas échéant — tests unitaires Django (manage.py test), etc.]`

## 5.2. Jeux d'essais fonctionnels

| # | Scénario | Données d'entrée | Résultat attendu | Statut |
|---|---|---|---|---|
| T1 | Inscription | username, email, mot de passe valides | Compte créé + jetons JWT renvoyés | ✅ |
| T2 | Inscription doublon | email déjà utilisé | Erreur explicite, pas de création | ✅ |
| T3 | Connexion valide | identifiants corrects | Jetons JWT, accès au dashboard | ✅ |
| T4 | Connexion invalide | mauvais mot de passe | 401 Unauthorized | ✅ |
| T5 | Accès protégé sans jeton | requête sans Authorization | 401 Unauthorized | ✅ |
| T6 | Rafraîchissement du jeton | refresh token valide | nouveau access token | ✅ |
| T7 | Enregistrement d'une séance | séance terminée | séance persistée et visible dans la progression | ✅ |
| T8 | Connexion sonde | sonde allumée à proximité | état « connecté », signal lu | ✅ |
| T9 | Perte de signal | sonde éteinte en cours | état « déconnecté » affiché, pas de crash | ✅ |
| T10 | Migration BDD | export SQLite → import PostgreSQL | 17 users / 50 séances intègres | ✅ |

*(Captures d'écran des jeux d'essais à placer en annexe.)*

## 5.3. Sécurité

**Authentification & accès**
- Authentification par **JWT** ; mots de passe **hachés** par Django (PBKDF2), jamais stockés en clair.
- Permission par défaut de l'API : **utilisateur authentifié requis** (`IsAuthenticated`).
- Jetons stockés côté mobile dans le **stockage sécurisé du système** (expo-secure-store), pas en clair.

**Base de données**
- Connexion à PostgreSQL en **SSL obligatoire** (`sslmode=require`).
- Secrets (mot de passe BDD, clé secrète Django) **hors du code**, dans des variables d'environnement (`.env` ignoré par Git).

**Données personnelles / RGPD**
- **Minimisation** : seules les données utiles à la rééducation sont collectées (niveau, objectif, symptômes, contexte).
- Les données de santé sont sensibles : accès restreint au seul propriétaire, suppression en cascade du profil et de ses données si le compte est supprimé.
- `[À COMPLÉTER : mention du consentement / politique de confidentialité présentée à l'utilisateur.]`

**Checklist de sécurité (synthèse) :**

| Point de contrôle | État |
|---|---|
| Mots de passe hachés (jamais en clair) | ✅ |
| Authentification requise sur les endpoints sensibles | ✅ |
| Jetons stockés dans le stockage sécurisé du système | ✅ |
| Connexion base de données chiffrée (SSL) | ✅ |
| Secrets hors du code (variables d'environnement) | ✅ |
| Suppression en cascade des données liées au compte | ✅ |
| `DEBUG = False` en production | ⏳ à activer |
| `ALLOWED_HOSTS` restreint | ⏳ à activer |
| Origines CORS restreintes au domaine réel | ⏳ à activer |
| `SECRET_KEY` forte via variable d'environnement | ⏳ à activer |

**Bonnes pratiques restant à durcir avant production publique** (voir aussi Critique constructive) :
- Passer `DEBUG = False` et restreindre `ALLOWED_HOSTS` ;
- Restreindre les origines CORS au domaine réel ;
- Générer une `SECRET_KEY` forte via variable d'environnement.
