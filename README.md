# Fiverr Starter API

Hello World API with **TypeScript**, **SQL Server**, and **TypeORM**, built with SOLID principles and ready to extend during the coding test.

---

## What you need before running the API

- **Node.js 18+** (to run the app)
- **SQL Server** (the app connects to it on startup). Either:
  - installed locally, or
  - run via Docker (see below), or
  - use **Docker Compose** to run both the API and SQL Server (no local Node or SQL Server needed)

---

## Quick start (after clone)

Do these in order.

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the app (required)

The app reads configuration from a `.env` file. Create it from the example and set at least the **database** settings so the API can connect to SQL Server.

```bash
copy .env.example .env
```

Then edit `.env`. The important part is **SQL Server connection** — the values must match a SQL Server instance that is (or will be) running:

| Variable | Meaning | Example |
|----------|---------|---------|
| `DB_SERVER` | SQL Server host | `localhost` (or `mssql` when using Docker Compose) |
| `DB_PORT` | Port | `1433` |
| `DB_USER` | Login | `sa` |
| `DB_PASSWORD` | Password | Must match the server’s SA password |
| `DB_NAME` | Database name | `master` |
| `DB_TRUST_CERTIFICATE` | Use for local/dev (e.g. self-signed cert) | `true` |

You can leave `PORT` and `NODE_ENV` as in `.env.example` unless you need to change them.

### 3. Have SQL Server running

The API will not start successfully until it can connect to SQL Server. Choose one:

- **SQL Server in Docker, app runs locally (recommended for development)**  
  Start **only** SQL Server in Docker Desktop (one command), then run the app with `npm run dev` so it updates live when you change code.

  ```bash
  npm run db
  ```

  Then in `.env` use (the default in `.env.example` matches this):

  - `DB_SERVER=localhost`
  - `DB_PORT=1433`
  - `DB_USER=sa`
  - `DB_PASSWORD=YourStrong@Passw0rd`
  - `DB_NAME=master`
  - `DB_TRUST_CERTIFICATE=true`

  To stop the database later: `npm run db:down`.

- **SQL Server already installed on your machine**  
  Start it (e.g. Windows Service or your usual way). Ensure the host/port/user/password in `.env` match this instance.

- **Everything in Docker (API + SQL Server)**  
  You do **not** need to install Node or SQL Server. One command brings up the full stack **with hot reload**:

  ```bash
  npm run dev:docker
  ```

  The API runs inside Docker with your code mounted; saving a file restarts the server. Use `Ctrl+C` to stop, or `docker compose down` in another terminal.

### 4. Run the API

- If you chose **SQL Server in Docker + app locally:** run `npm run dev` — the app will start and **reload automatically** when you change code.
- If you chose **Everything in Docker:** the API is already running (see step 3).

Otherwise: `npm run dev`, or `npm run build` then `npm start`.

### 5. Sanity check

- **GET http://localhost:3000/** — returns `{ "message": "Hello World" }`
- **GET http://localhost:3000/health** — returns JSON with `database: "connected"` and status 200
- **POST http://localhost:3000/greetings** — body `{ "name": "Your Name" }` inserts a row into the DB; optional `"message": "..."` overrides the default "Hello World"
- **GET http://localhost:3000/greetings** — returns the list of greetings (so you can confirm data in the DB, or check in SSMS under **master → Tables → Greetings**)

If these work, the project is configured correctly.

## Connect with SSMS (view the database)

When SQL Server is running (e.g. after `npm run db` or `npm run dev:docker`), you can open it in **SQL Server Management Studio (SSMS)**:

1. Open SSMS.
2. **Server name:** `localhost` or `localhost,1433` (same machine, port 1433).
3. **Authentication:** SQL Server Authentication.
4. **Login:** `sa`
5. **Password:** the value of `DB_PASSWORD` from your `.env` (e.g. `YourStrong@Passw0rd` if you didn’t change it).
6. Click **Connect**.

In Object Explorer: **Databases → master** (or the database name from `DB_NAME` in `.env`). There you can browse tables, run queries, and view data.

**What you see in the DB:** In development, TypeORM creates a **`Greetings`** table (from the `Greeting` entity). Use **POST /greetings** with body `{ "name": "Your Name" }` to insert a row; use **GET /greetings** to list them. In SSMS, open **Databases → master → Tables → Greetings** to see the data (columns: `id`, `name`, `message`, `createdAt`).

## Project structure (SOLID + TypeORM)

```
src/
├── config/          # env, settings
├── db/              # TypeORM DataSource (SQL Server), init/close with retry
├── entities/        # TypeORM entities (add one per table when you add features)
├── repositories/    # DB access (use DataSource / Repository<T>)
├── services/        # Business logic (depends on repositories via interfaces)
├── routes/          # HTTP endpoints (depends on services)
├── app.ts           # Express setup (inject services)
└── server.ts        # Entry: DataSource → repos → services → app
```

- **Adding a new feature:** Add an **entity** in `entities/`, a **repository** (interface + class using `DataSource.getRepository(Entity)`), **service**, **routes**, and wire in `app.ts` and `server.ts`. See `docs/ADDING_A_FEATURE.md`.
- **When you get the assignment in the test:** Follow the step-by-step checklist in **`docs/WHEN_YOU_GET_THE_ASSIGNMENT.md`** (read requirements → add entities one by one → wire → test).
- **Testing:** You can inject mocks of `IHealthRepository` / `IHealthService` without touching the DB.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run db` | Start **only** SQL Server in Docker (Docker Desktop). Use this then `npm run dev` for local dev with live reload |
| `npm run db:down` | Stop the SQL Server container started by `npm run db` |
| `npm run dev` | Run API locally with hot reload (tsx watch); requires Node and SQL Server running |
| `npm run dev:docker` | **One command:** API + SQL Server in Docker with hot reload — no local Node/SQL Server needed |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run `dist/server.js` |
| `npm run typecheck` | Type check without building |
