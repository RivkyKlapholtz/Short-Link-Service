import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import type { IHealthService } from "./services/index.js";
import type { ILinkService } from "./services/link.service.js";

describe("App HTTP routes", () => {
  let healthService: IHealthService;
  let linkService: ILinkService;

  beforeEach(() => {
    healthService = {
      getHello: () => ({ message: "Hello World" }),
      getHealth: async () => ({
        ok: true,
        message: "OK",
        database: "connected" as const,
        timestamp: new Date().toISOString(),
      }),
    };
    linkService = {
      createShortLink: async () => ({
        shortUrl: "http://localhost:3000/abc123",
        shortCode: "abc123",
        targetUrl: "https://example.com",
      }),
      resolveAndRecordClick: async () => ({ redirectUrl: "https://example.com" }),
      getStats: async () => ({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      }),
    };
  });

  const app = () => createApp(healthService, linkService);

  describe("GET /", () => {
    it("returns Hello World", async () => {
      const res = await request(app()).get("/");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Hello World" });
    });
  });

  describe("GET /health", () => {
    it("returns health status when ok", async () => {
      const res = await request(app()).get("/health");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: true,
        message: "OK",
        database: "connected",
      });
      expect(res.body.timestamp).toBeDefined();
    });

    it("returns 503 when database unreachable", async () => {
      healthService.getHealth = async () => ({
        ok: false,
        message: "Database unreachable",
        database: "disconnected" as const,
        timestamp: new Date().toISOString(),
      });
      const res = await request(app()).get("/health");
      expect(res.status).toBe(503);
      expect(res.body.ok).toBe(false);
    });
  });

  describe("POST /links", () => {
    it("returns 201 with short link on valid url", async () => {
      const res = await request(app())
        .post("/links")
        .send({ url: "https://example.com" });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        shortUrl: expect.any(String),
        shortCode: expect.any(String),
        targetUrl: "https://example.com",
      });
    });

    it("accepts targetUrl as body field", async () => {
      linkService.createShortLink = async (url) => ({
        shortUrl: "http://localhost:3000/xyz",
        shortCode: "xyz",
        targetUrl: url,
      });
      const res = await request(app())
        .post("/links")
        .send({ targetUrl: "https://other.com" });
      expect(res.status).toBe(201);
      expect(res.body.targetUrl).toBe("https://other.com");
    });

    it("returns 400 when url is missing", async () => {
      const res = await request(app())
        .post("/links")
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("url");
    });

    it("returns 400 when url is empty string", async () => {
      const res = await request(app())
        .post("/links")
        .send({ url: "   " });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /stats", () => {
    it("returns paginated stats", async () => {
      linkService.getStats = async () => ({
        data: [
          {
            url: "https://a.com",
            total_clicks: 5,
            total_earnings: 0.25,
            monthly_breakdown: [{ month: "02/2025", earnings: 0.25 }],
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      });
      const res = await request(app()).get("/stats");
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].url).toBe("https://a.com");
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(10);
    });

    it("passes page and limit query params", async () => {
      linkService.getStats = async (page, limit) => ({
        data: [],
        total: 0,
        page,
        limit,
      });
      const res = await request(app()).get("/stats?page=2&limit=5");
      expect(res.status).toBe(200);
      expect(res.body.page).toBe(2);
      expect(res.body.limit).toBe(5);
    });
  });

  describe("GET /:short_code", () => {
    it("redirects to target URL when short code exists", async () => {
      const res = await request(app())
        .get("/abc123")
        .redirects(0);
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("https://example.com");
    });

    it("returns 404 when short code not found", async () => {
      linkService.resolveAndRecordClick = async () => null;
      const res = await request(app()).get("/nonexistent");
      expect(res.status).toBe(404);
      expect(res.body.error).toContain("not found");
    });
  });
});
