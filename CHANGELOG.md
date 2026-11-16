# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [2.0.0] — 2026-11-16

Complete rewrite: the frontend and backend now live together in one repository.

### Added
- **Backend** (new): NestJS 12 REST API with TypeORM, PostgreSQL (production) and SQLite (zero-install development).
- Accounts with scrypt password hashing and a JWT stored in an httpOnly, SameSite cookie.
- Boards, columns, tasks and subtasks persisted per user, with ownership checks on every query.
- Drag-and-drop ordering saved on the server (`PATCH /tasks/:id/move`).
- A starter board for every new account (in English or French) and a demo account seed.
- Security hardening: Helmet headers, strict CORS, input whitelisting, rate-limited login, env validation.
- Portable database migration, verified to match the entities on SQLite and PostgreSQL.
- English / French interface, dark mode and a responsive mobile layout.
- 77 backend tests (unit + end-to-end on SQLite and PostgreSQL) and 35 frontend tests.
- GitHub Actions CI, bilingual README with screenshots.

### Changed
- Frontend rewritten in TypeScript: React 18 + Create React App → React 19 + Vite 8.
- State moved from a local `data.json` to the API with RTK Query (caching, optimistic updates).
- Tailwind CSS 3 → 4; accent colours tuned to meet WCAG AA contrast.

### Fixed
- Login accepted any email/password without contacting a server.
- Pages that did not compile (`Header`, `Userservice`, `Important!!`).
- Hard-coded API URLs on two different ports (8080 and 8081).
- Unused or duplicated dependencies (MUI, Font Awesome, MDB, lodash…).

## [1.0.0] — 2024-05-12

- Frontend prototype (React, Redux, Tailwind) with local sample data.
