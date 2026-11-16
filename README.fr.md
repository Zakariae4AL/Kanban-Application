<div align="center">

# 🗂️ Gestionnaire de tâches Kanban

**Un Kanban full-stack : tableaux, colonnes, tâches et sous-tâches avec glisser-déposer.**
Frontend React 19 + TypeScript · API NestJS + PostgreSQL · comptes sécurisés · français et anglais.

[![CI](https://github.com/YOUR_USERNAME/Latest-Kanban-Projet/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/Latest-Kanban-Projet/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)
![NestJS](https://img.shields.io/badge/NestJS-12-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Tests](https://img.shields.io/badge/tests-112%20r%C3%A9ussis-2ea44f)
![Licence](https://img.shields.io/badge/licence-MIT-green)

[English](README.md) · **Français**

![Démo : glisser-déposer, sous-tâches](docs/screenshots/demo.gif)

</div>

---

## Sommaire

- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Captures d'écran](#captures-décran)
- [Stack technique](#stack-technique)
- [Installation](#installation)
- [Architecture](#architecture)
- [API](#api)
- [Sécurité](#sécurité)
- [Tests](#tests)
- [Structure du projet](#structure-du-projet)
- [Feuille de route](#feuille-de-route)
- [Licence](#licence)

## Présentation

Le gestionnaire de tâches Kanban organise n'importe quel projet en tableaux et en colonnes (*À faire → En cours → Terminé*). Chaque tâche peut avoir une description et une liste de sous-tâches. On la déplace d'une colonne à l'autre par glisser-déposer ou depuis son menu de statut.

Chaque utilisateur a un compte sécurisé et toutes les données sont enregistrées sur le serveur. Toute l'interface est disponible en **français et en anglais**, en **mode clair ou sombre**, sur **ordinateur et mobile**.

## Fonctionnalités

- 🔐 **Comptes** : inscription, connexion, déconnexion ; la session est dans un cookie httpOnly que les scripts ne peuvent pas lire
- 🗂️ **Tableaux** : créer, renommer, supprimer ; ajouter, renommer, réordonner et supprimer des colonnes
- ✅ **Tâches et sous-tâches** : créer, modifier, supprimer, cocher les sous-tâches, avec la progression sur chaque carte
- 🖱️ **Glisser-déposer** entre et dans les colonnes, enregistré instantanément (interface optimiste, annulée en cas d'erreur)
- 🌍 **Français / anglais**, y compris le tableau d'exemple créé avec chaque nouveau compte
- 🌗 **Thème clair / sombre**, mémorisé par navigateur
- 📱 **Responsive** : barre latérale sur ordinateur, menu des tableaux sur mobile
- ♿ **Accessible** : fenêtres étiquetées avec piège de focus, navigation au clavier, contrastes WCAG AA
- 🧪 **112 tests automatisés** et intégration continue à chaque push

## Captures d'écran

| Clair | Sombre |
|---|---|
| ![Tableau, thème clair](docs/screenshots/board-light.png) | ![Tableau, thème sombre](docs/screenshots/board-dark.png) |
| **Détail d'une tâche** | **Nouvelle tâche** |
| ![Détail d'une tâche](docs/screenshots/task-details.png) | ![Ajouter une tâche](docs/screenshots/add-task-dark.png) |
| **Interface en français** | **Connexion** |
| ![Interface en français](docs/screenshots/board-fr.png) | ![Page de connexion](docs/screenshots/login.png) |

<p align="center">
  <img src="docs/screenshots/mobile-board.png" alt="Tableau sur mobile" width="260" />
  &nbsp;&nbsp;
  <img src="docs/screenshots/mobile-menu.png" alt="Menu des tableaux sur mobile" width="260" />
</p>

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 19, TypeScript, Vite 8, Redux Toolkit (RTK Query), React Router 7, Tailwind CSS 4 |
| Backend | NestJS 12, TypeScript, TypeORM, class-validator, Helmet, @nestjs/throttler |
| Base de données | PostgreSQL 16 (production) · SQLite via sql.js (développement sans installation) |
| Authentification | JWT (HS256) dans un cookie httpOnly · hachage des mots de passe avec scrypt |
| Tests | Jest + Supertest (backend) · Vitest + Testing Library + MSW (frontend) |
| Qualité | ESLint, Prettier, TypeScript strict, GitHub Actions |

## Installation

### Prérequis

- **Node.js 24** (voir `.nvmrc`) et npm
- Optionnel : PostgreSQL 16. Sans lui, l'API utilise automatiquement un fichier SQLite local.

### 1. Backend (API)

```bash
cd backend
cp .env.example .env      # puis mettez une longue chaîne aléatoire dans JWT_SECRET
npm install
npm run seed              # crée le compte de démo et ses tableaux
npm run start:dev         # http://localhost:3000/api/v1
```

Pour générer un secret :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

<details>
<summary>Utiliser PostgreSQL au lieu de SQLite</summary>

Dans `backend/.env` :

```env
DB_TYPE=postgres
DATABASE_URL=postgres://UTILISATEUR:MOT_DE_PASSE@localhost:5432/kanban
```

Les migrations créent le schéma de la base au démarrage de l'API.
</details>

### 2. Frontend

Dans un second terminal :

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Le serveur de développement Vite redirige `/api` vers le backend, donc le cookie de connexion fonctionne sans configuration.

### 3. Se connecter

Ouvrez http://localhost:5173 et cliquez sur **Essayer le compte de démo** (`demo@kanban.dev` / `Demo1234`), ou créez votre propre compte. Chaque nouveau compte commence avec un tableau d'exemple dans la langue choisie.

## Architecture

```mermaid
flowchart LR
    subgraph Navigateur
      UI[React 19 + TypeScript] --> RTK[Cache RTK Query]
    end
    RTK -- "/api/v1 + cookie httpOnly" --> API
    subgraph Serveur
      API[Contrôleurs NestJS] --> Guard[Garde d'auth + validation + limitation]
      Guard --> Services[Services tableaux et tâches<br/>contrôle du propriétaire]
      Services --> ORM[TypeORM + migrations]
    end
    ORM --> DB[(PostgreSQL / SQLite)]
```

- **Chaque requête est limitée à son propriétaire.** Les tâches sont chargées en remontant jusqu'à leur tableau et en filtrant sur `ownerId` : les données d'un autre utilisateur sont tout simplement introuvables (404).
- **Les positions sont stockées sur le serveur.** Déplacer une carte renumérote les colonnes de départ et d'arrivée dans une transaction.
- **L'interface est optimiste.** Le glisser-déposer et les cases à cocher se mettent à jour immédiatement, et reviennent en arrière si le serveur refuse.

## API

URL de base `http://localhost:3000/api/v1`. Toutes les routes sauf inscription, connexion, déconnexion et santé exigent le cookie de session.

| Méthode | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Créer un compte (`name`, `email`, `password`, `locale`) |
| `POST` | `/auth/login` | Se connecter, dépose le cookie de session |
| `POST` | `/auth/logout` | Supprimer le cookie de session |
| `GET` | `/auth/me` | Utilisateur connecté |
| `GET` | `/boards` | Lister mes tableaux |
| `POST` | `/boards` | Créer un tableau avec ses colonnes |
| `GET` | `/boards/:id` | Tableau avec colonnes, tâches et sous-tâches |
| `PATCH` | `/boards/:id` | Renommer ; ajouter, renommer, réordonner ou supprimer des colonnes |
| `DELETE` | `/boards/:id` | Supprimer un tableau et tout son contenu |
| `POST` | `/boards/:boardId/tasks` | Créer une tâche (avec sous-tâches) dans une colonne |
| `PATCH` | `/tasks/:id` | Modifier une tâche, ses sous-tâches ou sa colonne |
| `PATCH` | `/tasks/:id/move` | Déplacer vers une colonne à une position (glisser-déposer) |
| `DELETE` | `/tasks/:id` | Supprimer une tâche |
| `PATCH` | `/subtasks/:id` | Cocher / décocher une sous-tâche |
| `GET` | `/health` | État de santé (base de données comprise) |

```bash
# Se connecter et garder le cookie
curl -c cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"demo@kanban.dev","password":"Demo1234"}' \
  http://localhost:3000/api/v1/auth/login

# Lister les tableaux
curl -b cookies.txt http://localhost:3000/api/v1/boards
```

## Sécurité

| Risque | Protection |
|---|---|
| Vol de mots de passe | Hachage scrypt avec un sel aléatoire par utilisateur ; les hachages ne sont jamais renvoyés |
| Vol du jeton par XSS | JWT dans un cookie **httpOnly**, jamais exposé au JavaScript ni dans les réponses |
| CSRF | Cookie `SameSite=Lax` + API uniquement JSON + CORS limité à l'origine configurée |
| Accès aux données d'autrui | Propriétaire vérifié dans chaque requête ; un identifiant étranger renvoie 404 |
| Force brute sur la connexion | 10 tentatives par minute et par IP sur connexion/inscription (configurable) |
| Énumération des comptes | Même erreur et temps de réponse similaire pour un e-mail inconnu ou un mauvais mot de passe |
| Jetons falsifiés | Seul HS256 est accepté (`alg: none` refusé) ; un compte supprimé perd l'accès immédiatement |
| Assignation de masse / injection | Les DTO refusent les champs inconnus ; identifiants validés (UUID) ; requêtes paramétrées |
| Configuration faible | L'API refuse de démarrer en production avec un `JWT_SECRET` court ou par défaut |
| Attaques web courantes | En-têtes de sécurité Helmet (CSP, nosniff, frame options…) |

La suite de tests couvre ces cas : jetons falsifiés, expirés et `alg:none`, accès entre utilisateurs, limitation des tentatives, CORS, attributs du cookie.

## Tests

```bash
# Backend
cd backend
npm test                  # tests unitaires
npm run test:e2e          # bout en bout, SQLite en mémoire
npm run test:e2e:postgres # même suite sur PostgreSQL (nécessite TEST_DATABASE_URL)
npm run lint && npm run typecheck

# Frontend
cd frontend
npm run test:run          # Vitest + Testing Library + MSW
npm run coverage
npm run lint && npm run typecheck
```

| Suite | Tests |
|---|---|
| Backend unitaire (hachage, validation de l'environnement, règles de synchronisation, vues) | 17 |
| Backend bout en bout (auth, sécurité, tableaux, tâches, migrations, données de démo) | 60 × 2 bases |
| Frontend (pages, fenêtres, glisser-déposer, i18n, thème, utilitaires) | 35 |

La suite de bout en bout vérifie aussi que la migration correspond exactement aux entités sur les deux bases, et qu'elle peut être annulée.

## Structure du projet

```
.
├── backend/                  API NestJS
│   ├── src/
│   │   ├── auth/             inscription, connexion, cookie, garde, hachage
│   │   ├── boards/           tableaux + colonnes (entités, DTO, service, contrôleur)
│   │   ├── tasks/            tâches + sous-tâches, ordre du glisser-déposer
│   │   ├── users/            entité et service utilisateur
│   │   ├── database/         migration, source de données, données de démo
│   │   └── config/           validation de l'environnement
│   └── test/                 tests de bout en bout
├── frontend/                 application React
│   └── src/
│       ├── api/              endpoints RTK Query, types, hook de session
│       ├── features/auth/    pages de connexion et d'inscription
│       ├── features/board/   barre latérale, en-tête, colonnes, cartes, fenêtres
│       ├── components/       fenêtre modale, menu, champs, icônes, interrupteurs
│       ├── i18n/             messages français et anglais
│       └── test/             fausse API MSW, utilitaires de test
├── docs/screenshots/
└── .github/workflows/ci.yml
```

## Feuille de route

- [ ] Partager un tableau avec d'autres utilisateurs (rôles : propriétaire, éditeur, lecteur)
- [ ] Mises à jour en temps réel avec WebSockets
- [ ] Glisser-déposer tactile sur mobile
- [ ] Échéances, étiquettes et recherche
- [ ] Docker Compose et déploiement en un clic
- [ ] Documentation OpenAPI (Swagger)

## Licence

Distribué sous [licence MIT](LICENSE).
