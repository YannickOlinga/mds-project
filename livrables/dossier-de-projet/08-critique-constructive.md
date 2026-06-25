# 6. Critique constructive

## 6.1. Difficultés rencontrées et solutions

| Difficulté | Impact | Solution apportée |
|---|---|---|
| **Communication Bluetooth (BLE)** instable, gestion des permissions Android | Déconnexions, échecs de scan | Gestion explicite des permissions (Bluetooth + localisation), reconnexion automatique, affichage de l'état de connexion |
| **Migration SQLite → PostgreSQL** | Risque de perte de données | Export/import via `dumpdata`/`loaddata`, configuration multi-environnement par variables d'environnement, repli SQLite conservé |
| **Connexion à Supabase en IPv6 only** (connexion directe) | Échec de connexion en local | Utilisation du *Session pooler* (compatible IPv4) |
| **Caractères spéciaux dans l'URL de connexion** | Erreur de parsing de l'URL | Passage à des variables séparées (hôte, utilisateur, mot de passe) plutôt qu'une URL unique |
| **Pilotage d'un jeu par un signal temps réel** | Fluidité, latence | Normalisation du signal et animations performantes (reanimated) |

`[À COMPLÉTER : ajouter/retirer selon ton vécu réel du projet.]`

## 6.2. Bilan technique

**Points forts :**
- Architecture claire en couches, séparation des responsabilités ;
- Configuration multi-environnement (dev/prod) sans modification de code ;
- Base de données normalisée et documentée (MCD/MLD/MPD) ;
- Sécurité de l'authentification (JWT, hachage, stockage sécurisé des jetons).

**Points perfectibles :**
- Couverture de tests automatisés à renforcer ;
- Durcissement de la configuration de production (DEBUG, CORS, ALLOWED_HOSTS) ;
- Gestion d'erreurs Bluetooth encore améliorable sur certains appareils.

## 6.3. Perspectives d'évolution

- **Espace praticien** : partage des données de progression avec le professionnel de santé prescripteur ;
- **Programmes personnalisés** générés selon le profil et l'évolution mesurée ;
- **Notifications / rappels** intelligents pour améliorer l'observance ;
- **Nouveaux mini-jeux** et difficulté adaptative basée sur le signal réel ;
- **Mise en production complète** (CI/CD, hébergement de l'API, publication sur les stores via EAS) ;
- **Conformité renforcée** : hébergement de données de santé (HDS) si déploiement à grande échelle.
