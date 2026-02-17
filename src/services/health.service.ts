import type { IHealthRepository } from "../repositories/index.js";

export interface HealthStatus {
  ok: boolean;
  message: string;
  database: "connected" | "disconnected";
  timestamp: string;
}

export interface IHealthService {
  getHello(): { message: string };
  getHealth(): Promise<HealthStatus>;
}

export class HealthService implements IHealthService {
  constructor(private readonly healthRepository: IHealthRepository) {}

  getHello(): { message: string } {
    return { message: "Hello World" };
  }

  async getHealth(): Promise<HealthStatus> {
    const dbOk = await this.healthRepository.ping();
    return {
      ok: dbOk,
      message: dbOk ? "OK" : "Database unreachable",
      database: dbOk ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    };
  }
}
