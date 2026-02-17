import type { DataSource } from "typeorm";

export interface IHealthRepository {
  ping(): Promise<boolean>;
}

export class HealthRepository implements IHealthRepository {
  constructor(private readonly dataSource: DataSource) {}

  async ping(): Promise<boolean> {
    try {
      if (!this.dataSource.isInitialized) return false;
      const result = await this.dataSource.query<[{ ok: number }]>("SELECT 1 AS ok");
      return result[0]?.ok === 1;
    } catch {
      return false;
    }
  }
}
