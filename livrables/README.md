# 📂 Livrables — Titre CDA (B3 Développeur web)

Dossiers d'examen pour le titre **Concepteur Développeur d'Applications**, basés sur le projet **Périnéa**.

> Source des exigences : *Fiche cours — Dossier de projet et dossier professionnel* (document fourni).

Ce dossier contient **deux livrables distincts et obligatoires**, à imprimer et relier **en 2 exemplaires** chacun pour le jury.

---

## 1. 📘 Dossier Professionnel (DP) — `dossier-professionnel/`

> **15 à 20 pages hors annexes** (40-50 pages max avec annexes). **Mise en forme imposée** — respecter le gabarit officiel.

| # | Section | Fichier | État |
|---|---------|---------|------|
| 1 | Page de garde officielle | [00-page-de-garde.md](dossier-professionnel/00-page-de-garde.md) | ⬜ à compléter (perso) |
| 2 | Page de présentation officielle | [01-page-de-presentation.md](dossier-professionnel/01-page-de-presentation.md) | ⬜ à compléter (perso) |
| 3 | Sommaire (ordre du REAC) | [02-sommaire.md](dossier-professionnel/02-sommaire.md) | 🟦 trame |
| 4 | Exemples de pratique professionnelle | [03-exemples-pratique-professionnelle.md](dossier-professionnel/03-exemples-pratique-professionnelle.md) | 🟦 trame |
| 5 | Fiches activités types par compétence | [04-fiches-activites-types.md](dossier-professionnel/04-fiches-activites-types.md) | 🟩 pré-rempli projet |
| 6 | Titres et diplômes | [05-titres-et-diplomes.md](dossier-professionnel/05-titres-et-diplomes.md) | ⬜ à compléter (perso) |
| 7 | Déclaration sur l'honneur (signée) | [06-declaration-sur-lhonneur.md](dossier-professionnel/06-declaration-sur-lhonneur.md) | ⬜ à signer |
| 8 | Annexes (facultatives) | [07-annexes.md](dossier-professionnel/07-annexes.md) | 🟦 trame |

---

## 2. 📗 Dossier de Projet — `dossier-de-projet/`

> **30 à 35 pages hors annexes**. **Pas de mise en forme imposée** — liberté de présentation.

| # | Section | Fichier | État |
|---|---------|---------|------|
| 1 | Page de garde | [00-page-de-garde.md](dossier-de-projet/00-page-de-garde.md) | ⬜ à compléter (perso) |
| 2 | Lettre de remerciements | [01-lettre-de-remerciements.md](dossier-de-projet/01-lettre-de-remerciements.md) | 🟦 trame |
| 3 | Sommaire | [02-sommaire.md](dossier-de-projet/02-sommaire.md) | 🟩 pré-rempli |
| 4 | Mise en contexte | [03-mise-en-contexte.md](dossier-de-projet/03-mise-en-contexte.md) | 🟩 pré-rempli projet |
| 5 | Analyse préalable | [04-analyse-prealable.md](dossier-de-projet/04-analyse-prealable.md) | 🟩 pré-rempli projet |
| 6 | Plan de gestion du projet | [05-plan-de-gestion-projet.md](dossier-de-projet/05-plan-de-gestion-projet.md) | 🟩 pré-rempli projet |
| 7 | Compte rendu de production (BDD, code) | [06-compte-rendu-production.md](dossier-de-projet/06-compte-rendu-production.md) | 🟩 pré-rempli projet |
| 8 | Tests de conformité et de sécurité | [07-tests-conformite-securite.md](dossier-de-projet/07-tests-conformite-securite.md) | 🟩 pré-rempli projet |
| 9 | Critique constructive (difficultés, évolutivité) | [08-critique-constructive.md](dossier-de-projet/08-critique-constructive.md) | 🟩 pré-rempli projet |
| 10 | Conclusion personnelle | [09-conclusion-personnelle.md](dossier-de-projet/09-conclusion-personnelle.md) | 🟦 trame |
| 11 | Annexes (code commenté) | [10-annexes.md](dossier-de-projet/10-annexes.md) | 🟦 trame |

---

## Légende
- 🟩 **pré-rempli projet** : contenu rédigé à partir du code réel de Périnéa, à relire/ajuster.
- 🟦 **trame** : structure et consignes en place, à rédiger.
- ⬜ **perso** : informations personnelles à fournir (`[À COMPLÉTER : ...]`).

## Conseils de rédaction (rappel du PDF)
- Carte mentale pour organiser les idées ; méthodes **QQOQCP / 5W / 5M**.
- Plan, titres, sous-titres ; listes et tableaux pour le complexe.
- **Concision** : ne garder que les pièces pertinentes.
- **Relecture** : orthographe/grammaire, avis tuteur/formateurs/proches.
- Soigner la mise en forme (police, marges).

## Export en PDF / Word
Les fichiers sont en Markdown (faciles à éditer). Pour générer les versions imprimables :
```bash
# Markdown -> PDF (nécessite pandoc + un moteur LaTeX, ou utiliser un éditeur Markdown)
pandoc dossier-de-projet/*.md -o dossier-de-projet.pdf
```
Ou copier-coller dans Word/Google Docs pour appliquer la mise en forme officielle.
