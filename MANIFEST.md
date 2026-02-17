# MANIFEST – Short Link Service

## What works

- **POST /links** – Accepts a target URL in the body (`url` or `targetUrl`). Returns a unique short URL (`shortUrl`, `shortCode`, `targetUrl`). If the same target URL is submitted again, the existing short link is returned (no duplicate entries).
- **GET /:short_code** – Redirects to the target URL (302). Records a click; runs fraud validation (simulated: 500ms delay, 50% probability). Credit of $0.05 is stored only when validation passes.
- **GET /stats** – Returns a paginated list of all generated links. Query params: `page` (default 1), `limit` (default 10, max 100). Each item includes:
  - `url` (target URL)
  - `total_clicks`
  - `total_earnings`
  - `monthly_breakdown`: array of `{ month: "MM/yyyy", earnings }` (lifetime totals plus monthly aggregation).
- **Health:** GET `/` and GET `/health` for connectivity and DB check.
- **Tech:** TypeScript, Express, TypeORM, SQL Server. SOLID-style layers (entities, repositories, services, routes). Env-based config, retry on DB connect.
- **Automated tests:** Vitest unit + integration tests (`npm test`). Covers short-code generation, fraud validation, LinkService (create, resolve, stats), and HTTP routes. 27 tests; mocks used for repositories and services.

---

## What is missing
- **Validation:** Target URL is not validated as a proper URL (e.g. no `new URL()` or schema check); only non-empty string is required.
- **Rate limiting / security:** No rate limiting or auth; suitable for a timed exercise only.
- **Migrations:** Tables are created/updated via TypeORM `synchronize: true` in development only; no production migrations or versioned schema.

---

## DB justification

- **SQL Server + TypeORM:** Chosen to match the requirement (SQL Server) and to keep the codebase type-safe and maintainable (entities, relations, query builder).
- **Two tables:**  
  - **Links** – one row per short link (targetUrl, shortCode, createdAt). Normalized so the same target URL can be reused (idempotent POST).  
  - **Clicks** – one row per redirect event (linkId, createdAt, earnings). Enables exact click counts and per-click earnings; monthly breakdown is computed by grouping on formatted month (e.g. `FORMAT(createdAt, 'MM/yyyy')`) and summing earnings.
- **Earnings stored per click:** Instead of storing only a boolean “passed fraud”, we store the earnings amount (0 or 0.05) so that totals and monthly stats are simple SUMs and do not depend on re-running the fraud logic.

---

## Trade-offs

- **synchronize in dev:** Fast iteration and no migration setup; not suitable for production. A real system would use TypeORM migrations or another migration tool.
- **Fraud validation as a service:** Implemented as an injectable service (500ms delay + 50% pass) so it can be swapped or mocked without touching the link/click logic.
- **Stats in app layer:** Aggregation (totals + monthly breakdown) is done in the application via TypeORM Query Builder (group by linkId and month). Alternative: SQL views or stored procedures for heavier reporting loads.
- **Short code collision:** Random 6-character alphanumeric; on collision (rare) we retry. No dedicated “reserve and retry” queue; acceptable for the scope.

---

## AI usage & prompts

Main prompts used (copy-paste style):

1. **Implement full assignment from requirements**  
   “Implement the Fiverr short link assignment: POST /links (accept url, return short url; same url returns existing), GET /:short_code (redirect + record click, fraud validation 500ms 50% $0.05 credit), GET /stats (paginated, with total_clicks, total_earnings, monthly_breakdown). Use the existing TypeScript + TypeORM + SQL Server structure (entities, repositories, services, routes).”

2. **Idempotent short link creation**  
   “When creating a short link, if the target URL already exists in the DB, return the existing short link instead of creating a new one.”

3. **Stats aggregation**  
   “For GET /stats, for each link return total_clicks, total_earnings, and monthly_breakdown as an array of { month: 'MM/yyyy', earnings }. Use pagination (page, limit).”

4. **Fraud validation**  
   “Add a fraud validation step that runs when a short link is clicked: wait 500ms then return true or false with 50% probability. Only award the $0.05 credit when it returns true.”

5. **README and MANIFEST**  
   “Update README with: setup, architecture, testing, AI env setup. Create MANIFEST with: what works, what is missing, DB justification, trade-offs, and a section for AI usage & prompts where I can paste the main prompts I used.”

These were used in sequence to build the feature set and docs on top of the existing SOLID-style starter.
