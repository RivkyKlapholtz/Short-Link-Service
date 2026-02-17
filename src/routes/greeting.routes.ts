import { Router, type Request, type Response } from "express";
import type { IGreetingService } from "../services/index.js";

export function createGreetingRoutes(greetingService: IGreetingService): Router {
  const router = Router();

  router.post("/", async (req: Request, res: Response) => {
    const name = req.body?.name;
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Body must include a non-empty 'name' string" });
    }
    const message = typeof req.body?.message === "string" ? req.body.message : undefined;
    const greeting = await greetingService.add(name.trim(), message);
    return res.status(201).json(greeting);
  });

  router.get("/", async (_req: Request, res: Response) => {
    const list = await greetingService.list();
    res.json(list);
  });

  return router;
}
