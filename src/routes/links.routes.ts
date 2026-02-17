import { Router, type Request, type Response } from "express";
import type { ILinkService } from "../services/link.service.js";

export function createLinksRoutes(linkService: ILinkService): Router {
  const router = Router();

  router.post("/links", async (req: Request, res: Response) => {
    const url = req.body?.url ?? req.body?.targetUrl;
    if (typeof url !== "string" || !url.trim()) {
      return res.status(400).json({ error: "Body must include 'url' (target URL)" });
    }
    try {
      const result = await linkService.createShortLink(url.trim());
      return res.status(201).json(result);
    } catch (e) {
      return res.status(400).json({ error: e instanceof Error ? e.message : "Invalid request" });
    }
  });

  router.get("/stats", async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const stats = await linkService.getStats(page, limit);
    return res.json(stats);
  });

  router.get("/:short_code", async (req: Request, res: Response) => {
    const shortCode = req.params.short_code;
    if (!shortCode) return res.status(404).end();
    const result = await linkService.resolveAndRecordClick(shortCode);
    if (!result) return res.status(404).json({ error: "Short link not found" });
    return res.redirect(302, result.redirectUrl);
  });

  return router;
}
