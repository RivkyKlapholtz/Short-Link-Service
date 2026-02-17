import "reflect-metadata";
import { createApp } from "./app.js";
import { env } from "./config/index.js";
import { initDataSource, closeDataSource } from "./db/index.js";
import { Link } from "./entities/Link.js";
import { Click } from "./entities/Click.js";
import { HealthRepository, LinkRepository, ClickRepository } from "./repositories/index.js";
import { HealthService, LinkService, FraudValidationService } from "./services/index.js";

async function main(): Promise<void> {
  const dataSource = await initDataSource();
  const healthRepository = new HealthRepository(dataSource);
  const healthService = new HealthService(healthRepository);
  const linkRepository = new LinkRepository(dataSource.getRepository(Link));
  const clickRepository = new ClickRepository(dataSource.getRepository(Click));
  const fraudValidation = new FraudValidationService();
  const linkService = new LinkService(linkRepository, clickRepository, fraudValidation);
  const app = createApp(healthService, linkService);

  const server = app.listen(env.port, () => {
    console.log(`Server running at http://localhost:${env.port}`);
    console.log(`  GET /         -> Hello World`);
    console.log(`  GET /health   -> Health check`);
    console.log(`  POST /links   -> Create short link (body: { "url": "..." })`);
    console.log(`  GET /stats    -> Paginated stats (?page=1&limit=10)`);
    console.log(`  GET /:code    -> Redirect + record click`);
  });

  const shutdown = async (): Promise<void> => {
    server.close();
    await closeDataSource();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
