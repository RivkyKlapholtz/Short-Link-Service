import { Router, type Request, type Response } from "express";
import type { IHealthService } from "../services/index.js";

export function createHealthRoutes(healthService: IHealthService): Router {
  const router = Router();

  router.get("/", (_req: Request, res: Response) => {
    res.json(healthService.getHello());
  });

  router.get("/health", async (_req: Request, res: Response) => {
    const status = await healthService.getHealth();
    res.status(status.ok ? 200 : 503).json(status);
  });

  return router;
}
