import { describe, it, expect, vi, beforeEach } from "vitest";
import { LinkService } from "./link.service.js";
import type { Link } from "../repositories/link.repository.js";
import type { ILinkRepository } from "../repositories/link.repository.js";
import type { IClickRepository } from "../repositories/click.repository.js";
import type { IFraudValidationService } from "./fraud-validation.service.js";

vi.mock("../config/index.js", () => ({
  env: { baseUrl: "http://test.local" },
}));

function makeLink(overrides: Partial<Link> = {}): Link {
  return {
    id: 1,
    targetUrl: "https://example.com",
    shortCode: "abc123",
    createdAt: new Date(),
    ...overrides,
  };
}

describe("LinkService", () => {
  let linkRepo: ILinkRepository;
  let clickRepo: IClickRepository;
  let fraudValidation: IFraudValidationService;
  let service: LinkService;

  beforeEach(() => {
    linkRepo = {
      findByShortCode: vi.fn(),
      findByTargetUrl: vi.fn(),
      create: vi.fn(),
      findPaginated: vi.fn(),
      countAll: vi.fn(),
    };
    clickRepo = {
      recordClick: vi.fn().mockResolvedValue({}),
      getStatsForLinkIds: vi.fn().mockResolvedValue(new Map()),
    };
    fraudValidation = {
      validate: vi.fn().mockResolvedValue(true),
    };
    service = new LinkService(linkRepo, clickRepo, fraudValidation);
  });

  describe("createShortLink", () => {
    it("throws if targetUrl is empty", async () => {
      await expect(service.createShortLink("")).rejects.toThrow("targetUrl is required");
      await expect(service.createShortLink("   ")).rejects.toThrow("targetUrl is required");
    });

    it("returns existing link when same targetUrl exists", async () => {
      const existing = makeLink({ targetUrl: "https://example.com", shortCode: "xyz789" });
      vi.mocked(linkRepo.findByTargetUrl).mockResolvedValue(existing);
      vi.mocked(linkRepo.findByShortCode).mockResolvedValue(null);

      const result = await service.createShortLink("https://example.com");

      expect(result).toEqual({
        shortUrl: "http://test.local/xyz789",
        shortCode: "xyz789",
        targetUrl: "https://example.com",
      });
      expect(linkRepo.create).not.toHaveBeenCalled();
    });

    it("creates new link when targetUrl does not exist", async () => {
      vi.mocked(linkRepo.findByTargetUrl).mockResolvedValue(null);
      vi.mocked(linkRepo.findByShortCode).mockResolvedValue(null);
      const created = makeLink({ targetUrl: "https://new.com", shortCode: "new12" });
      vi.mocked(linkRepo.create).mockResolvedValue(created);

      const result = await service.createShortLink("https://new.com");

      expect(result).toEqual({
        shortUrl: "http://test.local/new12",
        shortCode: "new12",
        targetUrl: "https://new.com",
      });
      expect(linkRepo.create).toHaveBeenCalledWith("https://new.com", expect.any(String));
    });

    it("trims whitespace from targetUrl", async () => {
      const existing = makeLink({ targetUrl: "https://example.com", shortCode: "a1b2c3" });
      vi.mocked(linkRepo.findByTargetUrl).mockResolvedValue(existing);

      const result = await service.createShortLink("  https://example.com  ");

      expect(linkRepo.findByTargetUrl).toHaveBeenCalledWith("https://example.com");
      expect(result.targetUrl).toBe("https://example.com");
    });
  });

  describe("resolveAndRecordClick", () => {
    it("returns null when shortCode does not exist", async () => {
      vi.mocked(linkRepo.findByShortCode).mockResolvedValue(null);

      const result = await service.resolveAndRecordClick("unknown");

      expect(result).toBeNull();
      expect(clickRepo.recordClick).not.toHaveBeenCalled();
      expect(fraudValidation.validate).not.toHaveBeenCalled();
    });

    it("returns redirectUrl and records click when link exists", async () => {
      const link = makeLink({ id: 5, targetUrl: "https://target.com", shortCode: "go123" });
      vi.mocked(linkRepo.findByShortCode).mockResolvedValue(link);
      vi.mocked(fraudValidation.validate).mockResolvedValue(true);

      const result = await service.resolveAndRecordClick("go123");

      expect(result).toEqual({ redirectUrl: "https://target.com" });
      expect(fraudValidation.validate).toHaveBeenCalledOnce();
      expect(clickRepo.recordClick).toHaveBeenCalledWith(5, 0.05);
    });

    it("records click with 0 earnings when fraud validation fails", async () => {
      const link = makeLink({ id: 7, shortCode: "fail1" });
      vi.mocked(linkRepo.findByShortCode).mockResolvedValue(link);
      vi.mocked(fraudValidation.validate).mockResolvedValue(false);

      const result = await service.resolveAndRecordClick("fail1");

      expect(result).toEqual({ redirectUrl: link.targetUrl });
      expect(clickRepo.recordClick).toHaveBeenCalledWith(7, 0);
    });
  });

  describe("getStats", () => {
    it("returns paginated stats with correct shape", async () => {
      const links: Link[] = [
        makeLink({ id: 1, targetUrl: "https://a.com", shortCode: "a" }),
        makeLink({ id: 2, targetUrl: "https://b.com", shortCode: "b" }),
      ];
      vi.mocked(linkRepo.findPaginated).mockResolvedValue(links);
      vi.mocked(linkRepo.countAll).mockResolvedValue(2);
      vi.mocked(clickRepo.getStatsForLinkIds).mockResolvedValue(
        new Map([
          [1, { totalClicks: 10, totalEarnings: 0.5, monthlyBreakdown: [{ month: "02/2025", earnings: 0.5 }] }],
          [2, { totalClicks: 5, totalEarnings: 0.25, monthlyBreakdown: [{ month: "02/2025", earnings: 0.25 }] }],
        ])
      );

      const result = await service.getStats(1, 10);

      expect(result).toEqual({
        data: [
          { url: "https://a.com", total_clicks: 10, total_earnings: 0.5, monthly_breakdown: [{ month: "02/2025", earnings: 0.5 }] },
          { url: "https://b.com", total_clicks: 5, total_earnings: 0.25, monthly_breakdown: [{ month: "02/2025", earnings: 0.25 }] },
        ],
        total: 2,
        page: 1,
        limit: 10,
      });
    });

    it("clamps page to at least 1 and limit to 1–100", async () => {
      vi.mocked(linkRepo.findPaginated).mockResolvedValue([]);
      vi.mocked(linkRepo.countAll).mockResolvedValue(0);

      await service.getStats(0, 200);
      expect(linkRepo.findPaginated).toHaveBeenCalledWith(0, 100);

      vi.mocked(linkRepo.findPaginated).mockClear();
      await service.getStats(-5, 0);
      expect(linkRepo.findPaginated).toHaveBeenCalledWith(0, 1);
    });

    it("handles links with no clicks", async () => {
      const links = [makeLink({ id: 99, targetUrl: "https://noclicks.com" })];
      vi.mocked(linkRepo.findPaginated).mockResolvedValue(links);
      vi.mocked(linkRepo.countAll).mockResolvedValue(1);
      vi.mocked(clickRepo.getStatsForLinkIds).mockResolvedValue(new Map());

      const result = await service.getStats(1, 10);

      expect(result.data[0]).toEqual({
        url: "https://noclicks.com",
        total_clicks: 0,
        total_earnings: 0,
        monthly_breakdown: [],
      });
    });
  });
});
