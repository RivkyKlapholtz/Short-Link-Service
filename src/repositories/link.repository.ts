import type { Repository } from "typeorm";
import type { Link } from "../entities/Link.js";

export type { Link };

export interface ILinkRepository {
  findByShortCode(shortCode: string): Promise<Link | null>;
  findByTargetUrl(targetUrl: string): Promise<Link | null>;
  create(targetUrl: string, shortCode: string): Promise<Link>;
  findPaginated(skip: number, take: number): Promise<Link[]>;
  countAll(): Promise<number>;
}

export class LinkRepository implements ILinkRepository {
  constructor(private readonly repo: Repository<Link>) {}

  async findByShortCode(shortCode: string): Promise<Link | null> {
    return this.repo.findOne({ where: { shortCode } });
  }

  async findByTargetUrl(targetUrl: string): Promise<Link | null> {
    return this.repo.findOne({ where: { targetUrl } });
  }

  async create(targetUrl: string, shortCode: string): Promise<Link> {
    const link = this.repo.create({ targetUrl, shortCode });
    return this.repo.save(link);
  }

  async findPaginated(skip: number, take: number): Promise<Link[]> {
    return this.repo.find({
      order: { createdAt: "DESC" },
      skip,
      take,
    });
  }

  async countAll(): Promise<number> {
    return this.repo.count();
  }
}
