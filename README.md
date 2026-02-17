# Short Link Service (Fiverr Coding Test)

TypeScript + SQL Server + TypeORM API: short link generation, redirect with fraud validation, paginated stats with monthly breakdown, and Vitest automated tests.

---

## Setup

### Prerequisites

- **Node.js 18+**
- **SQL Server** (local or Docker)
- **Docker Desktop** (optional, for running SQL Server or full stack)

### Steps

1. **Clone and install**
   ```bash
   git clone https://github.com/RivkyKlapholtz/Short-Link-Service.git
   cd Short-Link-Service
   npm install
   ```

2. **Environment**
   ```bash
   copy .env.example .env
   ```
   Edit `.env`: set `DB_SERVER`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_TRUST_CERTIFICATE=true` to match your SQL Server.

3. **Start SQL Server** (if using Docker)
   ```bash
   npm run db
   ```

4. **Run the API**
   ```bash
   npm run dev
   ```
   Or full stack in Docker with hot reload: `npm run dev:docker`.

### API base

- Base URL: `http://localhost:3000` (or set `BASE_URL` in `.env`)

---

## Architecture

- **Layers (SOLID):** Config → DB (TypeORM DataSource) → Entities → Repositories → Services → Routes → Express app.
- **Dependency injection:** Repositories and services are wired in `server.ts` and receive dependencies via constructors; interfaces allow testing with mocks.
- **Single responsibility:** Each module has one role (e.g. `LinkRepository` for link persistence, `FraudValidationService` for the 500ms/50% simulation).
- **Open/closed:** New features add new entities/repos/services/routes without changing existing ones.

### Main components

| Layer       | Role |
|------------|------|
| `entities/` | TypeORM entities: `Link` (targetUrl, shortCode), `Click` (linkId, createdAt, earnings) |
| `repositories/` | Data access: `LinkRepository`, `ClickRepository` (including stats aggregation) |
| `services/` | Business logic: `LinkService` (create short link, resolve+record click, stats), `FraudValidationService` (500ms, 50% pass) |
| `routes/`   | HTTP: POST /links, GET /stats, GET /:short_code (redirect) |
| `config/`   | Env (port, baseUrl, DB, NODE_ENV) |
| `db/`       | TypeORM DataSource, init/close with retry |

### Database

- **Links:** id, targetUrl, shortCode (unique), createdAt.
- **Clicks:** id, linkId (FK), createdAt, earnings (0 or 0.05). TypeORM `synchronize: true` in development creates/updates tables.

---

## Testing

- **Automated:** Vitest unit + integration tests:
  ```bash
  npm test           # run once
  npm run test:watch # watch mode
  npm run test:coverage
  ```
  Covers: short-code generation, fraud validation, `LinkService` (create, resolve, stats), and HTTP routes (health, POST /links, GET /stats, GET /:short_code).

- **Manual:** Use Postman or cURL:
  - `POST /links` with `{ "url": "https://example.com" }` → short URL; repeat with same URL → same short URL.
  - `GET /<short_code>` → redirects to target and records a click (fraud check 500ms, 50% earns $0.05).
  - `GET /stats?page=1&limit=10` → paginated list with `url`, `total_clicks`, `total_earnings`, `monthly_breakdown`.
- **Health:** `GET /`, `GET /health` for sanity checks.
- **Unit/integration tests:** Implemented with Vitest + mocks; structure (interfaces, DI) enables isolated unit tests.

---

## AI environment setup

- **Cursor / VS Code** with an AI assistant (e.g. Cursor, GitHub Copilot, or Claude Code) was used during development.
- **Recommended:** Install and sign in to your preferred AI coding tool before the session; ensure the project opens at the repo root so the model has full context.
- **Prompting:** Use clear, concrete prompts (e.g. “add POST /links that accepts url and returns shortUrl; if same url exists return existing”) and reference existing patterns (e.g. “same structure as LinkService”) so the AI stays consistent with the architecture.

---

## Endpoints summary

| Method | Path | Description |
|--------|------|-------------|
| GET | / | Hello World |
| GET | /health | API + DB health |
| POST | /links | Create short link (body: `{ "url": "..." }`). Same URL returns existing. |
| GET | /stats | Paginated stats (`?page=1&limit=10`): url, total_clicks, total_earnings, monthly_breakdown |
| GET | /:short_code | Redirect to target URL and record click (fraud validation: 500ms, 50% credit $0.05) |
