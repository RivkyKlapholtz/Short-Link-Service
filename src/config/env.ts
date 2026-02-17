import "dotenv/config";

export const env = {
  port: parseInt(process.env["PORT"] ?? "3000", 10),
  baseUrl: process.env["BASE_URL"] ?? "http://localhost:3000",
  nodeEnv: process.env["NODE_ENV"] ?? "development",
  db: {
    server: process.env["DB_SERVER"] ?? "localhost",
    port: parseInt(process.env["DB_PORT"] ?? "1433", 10),
    user: process.env["DB_USER"] ?? "sa",
    password: process.env["DB_PASSWORD"] ?? "",
    database: process.env["DB_NAME"] ?? "master",
    trustCertificate: process.env["DB_TRUST_CERTIFICATE"] === "true",
  },
} as const;
