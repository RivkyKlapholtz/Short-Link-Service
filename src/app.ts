import express, { json } from "express";
import { createHealthRoutes, createGreetingRoutes } from "./routes/index.js";
import type { IHealthService, IGreetingService } from "./services/index.js";

export function createApp(
  healthService: IHealthService,
  greetingService: IGreetingService
): express.Express {
  const app = express();
  app.use(json());

  app.use("/", createHealthRoutes(healthService));
  app.use("/greetings", createGreetingRoutes(greetingService));

  return app;
}
