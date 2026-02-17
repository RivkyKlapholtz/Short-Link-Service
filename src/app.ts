import express, { json } from "express";
import { createHealthRoutes, createLinksRoutes } from "./routes/index.js";
import type { IHealthService } from "./services/index.js";
import type { ILinkService } from "./services/link.service.js";

export function createApp(
  healthService: IHealthService,
  linkService: ILinkService
): express.Express {
  const app = express();
  app.use(json());

  app.use("/", createHealthRoutes(healthService));
  app.use("/", createLinksRoutes(linkService));

  return app;
}
