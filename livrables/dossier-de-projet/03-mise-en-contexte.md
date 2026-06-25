# 1. Mise en contexte

## 1.1. Présentation de la structure et du besoin

`[À COMPLÉTER : présenter en quelques lignes l'entreprise / la structure d'accueil, son activité, son secteur (santé, e-santé, dispositif médical), et le contexte dans lequel le projet a été commandé.]`

Le projet **Périnéa** s'inscrit dans le domaine de la **e-santé** et plus précisément de la **rééducation périnéale**. La rééducation du périnée concerne un large public (post-partum, prévention, incontinence, post-opératoire) mais souffre d'un manque d'outils d'accompagnement à domicile, ludiques et motivants. Les séances en cabinet sont espacées, et l'observance des exercices à la maison reste faible.

## 1.2. Le projet Périnéa

Périnéa est une **application mobile (iOS et Android)** couplée à une **sonde connectée** (capteur de pression piloté par un microcontrôleur ESP32, communication Bluetooth Low Energy). L'application transforme les exercices de contraction/relâchement du périnée en **séances guidées et en mini-jeux** où le signal de la sonde contrôle l'action à l'écran (faire monter une bulle, suivre une trajectoire, etc.).

L'objectif est triple :
- **Guider** l'utilisateur dans des exercices adaptés à son niveau (débutant, intermédiaire, avancé) ;
- **Motiver** par la gamification (jeux, succès, suivi de progression, objectif mensuel) ;
- **Mesurer** l'activité réelle grâce à la sonde, pour un retour objectif.

## 1.3. Périmètre et objectifs

| Objectif | Description |
|---|---|
| Authentification | Inscription / connexion sécurisée des utilisateurs (JWT) |
| Onboarding & questionnaire | Profilage de l'utilisateur (niveau, objectif, symptômes, contexte) |
| Connexion sonde | Appairage Bluetooth et lecture du signal en temps réel |
| Exercices guidés | Séances minutées avec consignes et progression |
| Mini-jeux | Exercices ludiques pilotés par la sonde (bulles, éclipse, source) |
| Suivi & statistiques | Historique des séances, progression, succès débloqués |
| Gestion du profil | Préférences, notifications, objectif mensuel |

**Hors périmètre** (pour cette version) : téléconsultation, partage des données avec un praticien, paiement.

## 1.4. Mon rôle dans le projet

`[À COMPLÉTER : préciser ton rôle — ici, en tant que Concepteur Développeur d'Applications, tu as pris en charge la conception et le développement de l'application complète : modélisation de la base de données, développement du back-end (API REST), développement du front-end mobile, et intégration de la communication avec la sonde connectée.]`

J'ai été responsable de :
- la **conception de la base de données** (modèles conceptuel, logique et physique) ;
- le développement du **back-end** : API REST sécurisée (Django REST Framework, authentification JWT) ;
- le développement du **front-end mobile** : application React Native / Expo (navigation, écrans, état global, appels API) ;
- l'**intégration matérielle** : communication Bluetooth avec la sonde ESP32 ;
- le **déploiement** et la migration de la base vers un hébergement managé (Supabase / PostgreSQL).

## 1.5. Parties prenantes

| Partie prenante | Rôle / intérêt dans le projet |
|---|---|
| **Utilisateur final** | Réalise sa rééducation à domicile ; attend une expérience simple, motivante et rassurante. |
| **Professionnel de santé** (sage-femme, kinésithérapeute) | Prescripteur ; intéressé par l'observance et, à terme, le suivi des données. |
| **Porteur du projet / structure** | Commanditaire ; définit le besoin et les priorités. |
| **Développeur (moi)** | Conçoit, développe, teste et déploie l'application. |
| **Tuteur / formateurs** | Accompagnent et valident la démarche. |

## 1.6. Enjeux

- **Enjeu de santé** : améliorer l'efficacité de la rééducation par une meilleure observance à domicile.
- **Enjeu d'usage** : rendre un exercice répétitif et peu engageant agréable grâce à la gamification.
- **Enjeu technique** : fiabiliser la chaîne « capteur → mobile → serveur » et sécuriser des données sensibles.
- **Enjeu économique** : s'appuyer sur du matériel à faible coût (ESP32) pour rester accessible.

## 1.7. Glossaire

| Terme | Définition |
|---|---|
| **Périnée** | Ensemble de muscles soutenant les organes du bas du bassin. |
| **BLE** | *Bluetooth Low Energy*, protocole sans fil à faible consommation. |
| **ESP32** | Microcontrôleur avec Wi-Fi et Bluetooth intégrés, pilotant la sonde. |
| **JWT** | *JSON Web Token*, jeton d'authentification signé. |
| **ORM** | *Object-Relational Mapping*, couche d'accès objet à la base de données. |
| **REST** | Style d'architecture pour les API web (ressources, méthodes HTTP). |
| **RGPD** | Règlement Général sur la Protection des Données. |
| **Observance** | Degré de respect par le patient des exercices prescrits. |
