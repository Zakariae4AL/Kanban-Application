<div align="center">

# 🗂️ Kanban Task Manager

**A full-stack Kanban board: boards, columns, tasks and subtasks with drag and drop.**
React 19 + TypeScript frontend · NestJS + PostgreSQL API · secure accounts · English & French.

[![CI](https://github.com/YOUR_USERNAME/Latest-Kanban-Projet/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/Latest-Kanban-Projet/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)
![NestJS](https://img.shields.io/badge/NestJS-12-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Tests](https://img.shields.io/badge/tests-112%20passing-2ea44f)
![License](https://img.shields.io/badge/license-MIT-green)

**English** · [Français](README.fr.md)

![Demo: drag and drop, subtasks](docs/screenshots/demo.gif)

</div>

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Architecture](#architecture)
- [API](#api)
- [Security](#security)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Roadmap](#roadmap)
- [License](#license)

## Overview

Kanban Task Manager helps you organise any project into boards and columns (*Todo → Doing → Done*). Each task can have a description and a checklist of subtasks, and you move it between columns by drag and drop or from its status menu.

Each user has a secure account, and all data is saved on the server. The whole interface is available in **English and French**, in **light or dark** mode, on **desktop and mobile**.

## Features

- 🔐 **Accounts**: sign up, log in, log out; the session lives in an httpOnly cookie that scripts can't read
- 🗂️ **Boards**: create, rename, delete; add, rename, reorder and remove columns
- ✅ **Tasks & subtasks**: create, edit, delete, tick subtasks, with progress shown on every card
- 🖱️ **Drag and drop** between and within columns, saved instantly (optimistic UI, rolled back on error)
- 🌍 **English / French**, including the starter board created with each new account
- 🌗 **Light / dark theme**, remembered per browser
- 📱 **Responsive**: sidebar on desktop, board menu on mobile
- ♿ **Accessible**: labelled dialogs with focus trap, keyboard navigation, WCAG AA colour contrast
- 🧪 **112 automated tests** and CI on every push

## Screenshots

| Light | Dark |
|---|---|
| ![Board, light theme](docs/screenshots/board-light.png) | ![Board, dark theme](docs/screenshots/board-dark.png) |
| **Task details** | **New task** |
| ![Task details](docs/screenshots/task-details.png) | ![Add a task](docs/screenshots/add-task-dark.png) |
| **French interface** | **Login** |
| ![Interface in French](docs/screenshots/board-fr.png) | ![Login page](docs/screenshots/login.png) |

<p align="center">
  <img src="docs/screenshots/mobile-board.png" alt="Mobile board" width="260" />
  &nbsp;&nbsp;
  <img src="docs/screenshots/mobile-menu.png" alt="Mobile board menu" width="260" />
</p>

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 8, Redux Toolkit (RTK Query), React Router 7, Tailwind CSS 4 |
| Backend | NestJS 12, TypeScript, TypeORM, class-validator, Helmet, @nestjs/throttler |
| Database | PostgreSQL 16 (production) · SQLite via sql.js (zero-install development) |
| Auth | JWT (HS256) in an httpOnly cookie · scrypt password hashing |
| Tests | Jest + Supertest (backend) · Vitest + Testing Library + MSW (frontend) |
| Quality | ESLint, Prettier, strict TypeScript, GitHub Actions |

## Getting started

### Prerequisites

- **Node.js 24** (see `.nvmrc`) and npm
- Optional: PostgreSQL 16. Without it, the API uses a local SQLite file automatically.

### 1. Backend (API)

```bash
cd backend
cp .env.example .env      # then set JWT_SECRET to a long random string
npm install
npm run seed              # creates the demo account and its boards
npm run start:dev         # http://localhost:3000/api/v1
```

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

<details>
<summary>Use PostgreSQL instead of SQLite</summary>

In `backend/.env`:

```env
DB_TYPE=postgres
DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/kanban
```

The database schema is created by migrations when the API starts.
</details>

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

The Vite dev server forwards `/api` to the backend, so the login cookie works without any extra setup.

### 3. Log in

Open http://localhost:5173 and click **Try the demo account** (`demo@kanban.dev` / `Demo1234`), or create your own account. New accounts start with a sample board in the language you chose.

## Architecture

```mermaid
flowchart LR
    subgraph Browser
      UI[React 19 + TypeScript] --> RTK[RTK Query cache]
    end
    RTK -- "/api/v1 + httpOnly cookie" --> API
    subgraph Server
      API[NestJS controllers] --> Guard[Auth guard + validation + rate limit]
      Guard --> Services[Board & task services<br/>ownership checks]
      Services --> ORM[TypeORM + migrations]
    end
    ORM --> DB[(PostgreSQL / SQLite)]
```

- **Every query is scoped to its owner.** Tasks are loaded by joining up to their board and filtering on `ownerId`, so another user's data simply isn't found (404).
- **Positions are stored on the server.** Moving a card renumbers the source and target columns inside a transaction.
- **The UI is optimistic.** Drag and drop and subtask ticks update the cache instantly, and roll back if the server refuses.

## API

Base URL `http://localhost:3000/api/v1`. All routes except register, login, logout and health require the session cookie.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create an account (`name`, `email`, `password`, `locale`) |
| `POST` | `/auth/login` | Log in, sets the session cookie |
| `POST` | `/auth/logout` | Clear the session cookie |
| `GET` | `/auth/me` | Current user |
| `GET` | `/boards` | List my boards |
| `POST` | `/boards` | Create a board with its columns |
| `GET` | `/boards/:id` | Board with columns, tasks and subtasks |
| `PATCH` | `/boards/:id` | Rename; add, rename, reorder or remove columns |
| `DELETE` | `/boards/:id` | Delete a board and everything in it |
| `POST` | `/boards/:boardId/tasks` | Create a task (with subtasks) in a column |
| `PATCH` | `/tasks/:id` | Edit a task, its subtasks or its column |
| `PATCH` | `/tasks/:id/move` | Move to a column at a position (drag and drop) |
| `DELETE` | `/tasks/:id` | Delete a task |
| `PATCH` | `/subtasks/:id` | Tick / untick a subtask |
| `GET` | `/health` | Health check (database included) |

```bash
# Log in and keep the cookie
curl -c cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"demo@kanban.dev","password":"Demo1234"}' \
  http://localhost:3000/api/v1/auth/login

# List boards
curl -b cookies.txt http://localhost:3000/api/v1/boards
```

## Security

| Risk | Protection |
|---|---|
| Stolen passwords | scrypt hashing with a random salt per user; hashes are never returned |
| Token theft by XSS | JWT in an **httpOnly** cookie, never exposed to JavaScript or in responses |
| CSRF | `SameSite=Lax` cookie + JSON-only API + CORS limited to the configured origin |
| Accessing other users' data | Ownership checked in every query; foreign ids return 404 |
| Brute-force login | 10 attempts per minute per IP on login/register (configurable) |
| Account enumeration | Same error and similar timing for unknown email and wrong password |
| Forged tokens | Only HS256 is accepted (`alg: none` rejected); deleted accounts lose access immediately |
| Mass assignment / injection | DTO whitelisting rejects unknown fields; UUID-validated ids; parameterised queries |
| Weak configuration | The API refuses to start with a short or default `JWT_SECRET` in production |
| Common web attacks | Helmet security headers (CSP, nosniff, frame options…) |

The test suite covers these cases (forged, expired and `alg:none` tokens, cross-user access, rate limiting, CORS, cookie flags).

## Testing

```bash
# Backend
cd backend
npm test                  # unit tests
npm run test:e2e          # end-to-end, SQLite in memory
npm run test:e2e:postgres # same suite on PostgreSQL (needs TEST_DATABASE_URL)
npm run lint && npm run typecheck

# Frontend
cd frontend
npm run test:run          # Vitest + Testing Library + MSW
npm run coverage
npm run lint && npm run typecheck
```

| Suite | Tests |
|---|---|
| Backend unit (password hashing, env validation, sync rules, views) | 17 |
| Backend end-to-end (auth, security, boards, tasks, migrations, seed) | 60 × 2 databases |
| Frontend (pages, dialogs, drag and drop, i18n, theme, helpers) | 35 |

The end-to-end suite also checks that the migration exactly matches the entities on both databases, and that it can be rolled back.

## Project structure

```
.
├── backend/                  NestJS API
│   ├── src/
│   │   ├── auth/             register, login, cookie, guard, password hashing
│   │   ├── boards/           boards + columns (entities, DTOs, service, controller)
│   │   ├── tasks/            tasks + subtasks, drag-and-drop ordering
│   │   ├── users/            user entity and service
│   │   ├── database/         migration, data source, demo seed
│   │   └── config/           environment validation
│   └── test/                 end-to-end tests
├── frontend/                 React app
│   └── src/
│       ├── api/              RTK Query endpoints, types, session hook
│       ├── features/auth/    login & signup pages
│       ├── features/board/   sidebar, header, columns, cards, dialogs
│       ├── components/       modal, menu, fields, icons, toggles
│       ├── i18n/             English & French messages
│       └── test/             MSW fake API, test helpers
├── docs/screenshots/
└── .github/workflows/ci.yml
```

## Roadmap

- [ ] Share a board with other users (roles: owner, editor, viewer)
- [ ] Real-time updates with WebSockets
- [ ] Touch drag and drop on mobile
- [ ] Due dates, labels and search
- [ ] Docker Compose setup and one-click deployment
- [ ] OpenAPI (Swagger) documentation

## License

Released under the [MIT License](LICENSE).
