import type { Repository } from "typeorm";
import type { Click } from "../entities/Click.js";

export type { Click };

export interface LinkStats {
  totalClicks: number;
  totalEarnings: number;
  monthlyBreakdown: { month: string; earnings: number }[];
}

export interface IClickRepository {
  recordClick(linkId: number, earnings: number): Promise<Click>;
  getStatsForLinkIds(linkIds: number[]): Promise<Map<number, LinkStats>>;
}

export class ClickRepository implements IClickRepository {
  constructor(private readonly repo: Repository<Click>) {}

  async recordClick(linkId: number, earnings: number): Promise<Click> {
    const click = this.repo.create({ linkId, earnings });
    return this.repo.save(click);
  }

  async getStatsForLinkIds(linkIds: number[]): Promise<Map<number, LinkStats>> {
    if (linkIds.length === 0) return new Map();

    const ids = linkIds.join(",");
    const totals = await this.repo
      .createQueryBuilder("c")
      .select("c.linkId", "linkId")
      .addSelect("COUNT(*)", "totalClicks")
      .addSelect("SUM(c.earnings)", "totalEarnings")
      .where(`c.linkId IN (${ids})`)
      .groupBy("c.linkId")
      .getRawMany<{ linkId: number; totalClicks: string; totalEarnings: string }>();

    const monthly = await this.repo
      .createQueryBuilder("c")
      .select("c.linkId", "linkId")
      .addSelect("FORMAT(c.createdAt, 'MM/yyyy')", "month")
      .addSelect("SUM(c.earnings)", "earnings")
      .where(`c.linkId IN (${ids})`)
      .groupBy("c.linkId")
      .addGroupBy("FORMAT(c.createdAt, 'MM/yyyy')")
      .addOrderBy("month", "DESC")
      .getRawMany<{ linkId: number; month: string; earnings: string }>();

    const map = new Map<number, LinkStats>();
    for (const t of totals) {
      map.set(t.linkId, {
        totalClicks: parseInt(t.totalClicks, 10),
        totalEarnings: parseFloat(t.totalEarnings) || 0,
        monthlyBreakdown: [],
      });
    }
    for (const m of monthly) {
      const stat = map.get(m.linkId);
      if (stat) {
        stat.monthlyBreakdown.push({
          month: m.month,
          earnings: parseFloat(m.earnings) || 0,
        });
      }
    }
    return map;
  }
}
