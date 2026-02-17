import type { Link } from "../repositories/link.repository.js";
import type { ILinkRepository } from "../repositories/link.repository.js";
import type { IClickRepository } from "../repositories/click.repository.js";
import type { IFraudValidationService } from "./fraud-validation.service.js";
import { EARNINGS_PER_VALID_CLICK } from "../entities/Click.js";
import { generateShortCode } from "../utils/short-code.js";
import { env } from "../config/index.js";

export interface ShortLinkResult {
  shortUrl: string;
  shortCode: string;
  targetUrl: string;
}

export interface LinkStatsItem {
  url: string;
  total_clicks: number;
  total_earnings: number;
  monthly_breakdown: { month: string; earnings: number }[];
}

export interface PaginatedStats {
  data: LinkStatsItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ILinkService {
  createShortLink(targetUrl: string): Promise<ShortLinkResult>;
  resolveAndRecordClick(shortCode: string): Promise<{ redirectUrl: string } | null>;
  getStats(page: number, limit: number): Promise<PaginatedStats>;
}

export class LinkService implements ILinkService {
  constructor(
    private readonly linkRepository: ILinkRepository,
    private readonly clickRepository: IClickRepository,
    private readonly fraudValidation: IFraudValidationService
  ) {}

  async createShortLink(targetUrl: string): Promise<ShortLinkResult> {
    const normalized = targetUrl.trim();
    if (!normalized) throw new Error("targetUrl is required");

    const existing = await this.linkRepository.findByTargetUrl(normalized);
    if (existing) {
      return this.toResult(existing);
    }

    let shortCode: string;
    let link: Link;
    do {
      shortCode = generateShortCode();
      const collision = await this.linkRepository.findByShortCode(shortCode);
      if (!collision) {
        link = await this.linkRepository.create(normalized, shortCode);
        break;
      }
    } while (true);

    return this.toResult(link!);
  }

  private toResult(link: Link): ShortLinkResult {
    return {
      shortUrl: `${env.baseUrl}/${link.shortCode}`,
      shortCode: link.shortCode,
      targetUrl: link.targetUrl,
    };
  }

  async resolveAndRecordClick(shortCode: string): Promise<{ redirectUrl: string } | null> {
    const link = await this.linkRepository.findByShortCode(shortCode);
    if (!link) return null;

    const passed = await this.fraudValidation.validate();
    const earnings = passed ? EARNINGS_PER_VALID_CLICK : 0;
    await this.clickRepository.recordClick(link.id, earnings);

    return { redirectUrl: link.targetUrl };
  }

  async getStats(page: number, limit: number): Promise<PaginatedStats> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [links, total] = await Promise.all([
      this.linkRepository.findPaginated(skip, safeLimit),
      this.linkRepository.countAll(),
    ]);

    const linkIds = links.map((l) => l.id);
    const statsMap = await this.clickRepository.getStatsForLinkIds(linkIds);

    const data: LinkStatsItem[] = links.map((link) => {
      const stat = statsMap.get(link.id) ?? {
        totalClicks: 0,
        totalEarnings: 0,
        monthlyBreakdown: [],
      };
      return {
        url: link.targetUrl,
        total_clicks: stat.totalClicks,
        total_earnings: Math.round(stat.totalEarnings * 100) / 100,
        monthly_breakdown: stat.monthlyBreakdown.map((m) => ({
          month: m.month,
          earnings: Math.round(m.earnings * 100) / 100,
        })),
      };
    });

    return { data, total, page: safePage, limit: safeLimit };
  }
}
