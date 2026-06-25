# 2. Analyse préalable

## 2.1. Expression du besoin (méthode QQOQCP)

| Question | Réponse |
|---|---|
| **Quoi ?** | Une application mobile de rééducation périnéale couplée à une sonde connectée. |
| **Qui ?** | Utilisateurs réalisant une rééducation du périnée (post-partum, prévention, suivi). Indirectement : les professionnels de santé prescripteurs. |
| **Où ?** | À domicile, en autonomie, sur smartphone (iOS/Android), entre les séances en cabinet. |
| **Quand ?** | Séances courtes et régulières (objectif d'observance quotidienne), suivi mensuel. |
| **Comment ?** | Exercices guidés et mini-jeux pilotés par le signal de la sonde (Bluetooth), avec suivi de progression et gamification. |
| **Pourquoi ?** | Améliorer l'observance et la motivation, objectiver l'activité, rendre la rééducation moins contraignante et plus engageante. |

## 2.2. Étude de l'existant

`[À COMPLÉTER / ajuster selon ta veille concurrentielle réelle]`

Plusieurs applications de rééducation périnéale existent, mais la majorité :
- proposent uniquement des **timers d'exercices** sans mesure réelle (pas de retour objectif) ;
- n'intègrent **pas de matériel connecté**, ou via des sondes propriétaires coûteuses ;
- offrent une **gamification limitée**, d'où une faible rétention.

**Apport différenciant de Périnéa** : la combinaison d'une sonde connectée open-hardware (ESP32, faible coût) et d'une expérience ludique (mini-jeux pilotés par le signal réel).

## 2.3. Spécifications fonctionnelles

**Acteurs :** Utilisateur (principal), Sonde connectée (acteur matériel), Système.

**Cas d'usage principaux :**
- S'inscrire / se connecter ;
- Compléter l'onboarding et le questionnaire de profilage ;
- Appairer et connecter la sonde ;
- Réaliser une séance d'exercice guidé ;
- Jouer à un mini-jeu piloté par la sonde ;
- Consulter sa progression, ses statistiques et ses succès ;
- Gérer son profil et ses préférences.

**Exemple — User stories :**
> *En tant qu'utilisateur, je veux que mes séances soient enregistrées automatiquement afin de suivre ma progression sans saisie manuelle.*
> *En tant qu'utilisateur débutant, je veux des exercices adaptés à mon niveau afin de ne pas être découragé.*

**Liste des cas d'usage :**

| Réf. | Cas d'usage | Acteur | Priorité |
|---|---|---|---|
| UC-01 | S'inscrire | Utilisateur | Haute |
| UC-02 | Se connecter / se déconnecter | Utilisateur | Haute |
| UC-03 | Compléter l'onboarding et le questionnaire | Utilisateur | Haute |
| UC-04 | Appairer et connecter la sonde | Utilisateur, Sonde | Haute |
| UC-05 | Réaliser une séance d'exercice guidé | Utilisateur, Sonde | Haute |
| UC-06 | Jouer à un mini-jeu | Utilisateur, Sonde | Moyenne |
| UC-07 | Consulter sa progression et ses statistiques | Utilisateur | Haute |
| UC-08 | Débloquer et consulter des succès | Utilisateur | Basse |
| UC-09 | Gérer son profil et ses préférences | Utilisateur | Moyenne |

## 2.3 bis. Exigences non fonctionnelles

| Catégorie | Exigence |
|---|---|
| **Sécurité** | Authentification obligatoire, chiffrement des échanges (HTTPS/SSL), hachage des mots de passe. |
| **Performance** | Réactivité des écrans de jeu (signal sonde traité en temps quasi réel). |
| **Disponibilité** | Base de données hébergée et sauvegardée (Supabase). |
| **Portabilité** | Application unique fonctionnant sur iOS et Android. |
| **Maintenabilité** | Code typé (TypeScript), architecture en couches, configuration par variables d'environnement. |
| **Conformité** | Respect du RGPD pour les données personnelles et de santé. |
| **Ergonomie** | Interface simple, accessible à un public non technique. |

## 2.4. Spécifications techniques et choix d'architecture

Architecture **3 tiers** + couche matérielle :

```
[ Sonde ESP32 ]  --BLE-->  [ App mobile Expo/RN ]  --HTTPS/REST-->  [ API Django ]  --SQL-->  [ PostgreSQL (Supabase) ]
```

| Couche | Technologie | Justification |
|---|---|---|
| Matériel | ESP32 (C/Arduino), BLE | Microcontrôleur Wi-Fi/BLE à faible coût, large communauté |
| Front mobile | React Native + **Expo (SDK 54)**, TypeScript | Cross-platform iOS/Android, écosystème riche, typage |
| Navigation / état | expo-router, Zustand, React Query | Routage par fichiers, état global léger, cache des requêtes |
| Back-end | **Django 5 + Django REST Framework** | Productivité, ORM robuste, sérialisation, écosystème mature |
| Authentification | JWT (djangorestframework-simplejwt) | Stateless, adapté au mobile |
| Base de données | **PostgreSQL** hébergé sur **Supabase** | Relationnel robuste, hébergement managé, sauvegardes |

## 2.5. Contraintes

- **Données de santé / RGPD** : les données saisies (symptômes, contexte de naissance) relèvent de la sphère privée. Minimisation des données, consentement, sécurisation des accès (voir section Tests & Sécurité).
- **Matériel** : fiabilité de la connexion Bluetooth, gestion des déconnexions, autonomie de la sonde.
- **Multi-plateforme** : comportements iOS/Android (permissions Bluetooth, localisation pour le scan BLE sur Android).
- **Accessibilité et ergonomie** : public non technique, interface simple et rassurante.
