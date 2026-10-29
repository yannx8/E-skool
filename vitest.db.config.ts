import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Local default matches docker-compose.yml. CI and real runs set DATABASE_URL explicitly.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["tests/db/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://eskool:eskool@localhost:5433/eskool",
    },
  },
});
