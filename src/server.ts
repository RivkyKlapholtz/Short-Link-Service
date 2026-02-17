import "reflect-metadata";
import { createApp } from "./app.js";
import { env } from "./config/index.js";
import { initDataSource, closeDataSource } from "./db/index.js";
import { Greeting } from "./entities/Greeting.js";
import { HealthRepository, GreetingRepository } from "./repositories/index.js";
import { HealthService, GreetingService } from "./services/index.js";

async function main(): Promise<void> {
  const dataSource = await initDataSource();
  const healthRepository = new HealthRepository(dataSource);
  const healthService = new HealthService(healthRepository);
  const greetingRepository = new GreetingRepository(dataSource.getRepository(Greeting));
  const greetingService = new GreetingService(greetingRepository);
  const app = createApp(healthService, greetingService);

  const server = app.listen(env.port, () => {
    console.log(`Server running at http://localhost:${env.port}`);
    console.log(`  GET /           -> Hello World`);
    console.log(`  GET /health     -> API + DB health check`);
    console.log(`  GET /greetings  -> List who said hello`);
    console.log(`  POST /greetings -> Add (body: { "name": "Your Name" })`);
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
