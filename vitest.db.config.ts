import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Local defaults match docker-compose.yml. CI and real runs set both variables explicitly.
// DIRECT_URL is the owner (migrations and test setup); DATABASE_URL is the app role (eskool_app).
// Set here, not in test.env, so the globalSetup in the parent process sees them too.
process.env.DIRECT_URL ??= "postgresql://eskool:eskool@localhost:5433/eskool";
process.env.DATABASE_URL ??= "postgresql://eskool_app:eskool_app@localhost:5433/eskool";
// Test-only values; never used outside test:db.
process.env.BETTER_AUTH_SECRET ??= "test-only-secret-not-for-production-000";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["tests/db/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
    // scrypt hashing and the first better-auth load exceed the 5 s default on cold runs.
    testTimeout: 30_000,
    globalSetup: ["tests/db/global-setup.ts"],
  },
});
