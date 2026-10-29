import { defineConfig, env } from "prisma/config";

// Next.js reads .env itself; the Prisma CLI needs it loaded here.
try {
  process.loadEnvFile(".env");
} catch {}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx --conditions=react-server prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
