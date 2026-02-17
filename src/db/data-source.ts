import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "../config/index.js";
import { Greeting } from "../entities/Greeting.js";

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 3000;

export const AppDataSource = new DataSource({
  type: "mssql",
  host: env.db.server,
  port: env.db.port,
  username: env.db.user,
  password: env.db.password,
  database: env.db.database,
  options: {
    encrypt: true,
    trustServerCertificate: env.db.trustCertificate,
    enableArithAbort: true,
  },
  entities: [Greeting],
  migrations: [],
  synchronize: env.nodeEnv === "development",
  logging: env.nodeEnv === "development",
});

export async function initDataSource(): Promise<DataSource> {
  if (AppDataSource.isInitialized) return AppDataSource;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await AppDataSource.initialize();
      return AppDataSource;
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      console.warn(
        `DB connection attempt ${attempt}/${MAX_RETRIES} failed, retrying in ${RETRY_DELAY_MS}ms...`
      );
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  throw new Error("Failed to connect to database");
}

export async function closeDataSource(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}
