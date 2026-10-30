import { execFileSync } from "node:child_process";
import { PrismaPg } from "@prisma/adapter-pg";
import { parseConfig } from "../../src/config";
import { PrismaClient } from "../../src/generated/prisma/client";

// Runs once before the db suite. Migrations run as the owner (DIRECT_URL).
// Dev and CI only: the password below is a test value and the guard refuses non-local hosts.
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

export default async function setup(): Promise<void> {
  const { DIRECT_URL } = parseConfig(process.env);
  if (!DIRECT_URL) {
    throw new Error("test:db needs DIRECT_URL (the owner connection used for migrations)");
  }
  if (!LOCAL_HOSTS.includes(new URL(DIRECT_URL).hostname)) {
    throw new Error("test:db refuses a non-local DIRECT_URL; point it at localhost");
  }

  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  // The migration creates eskool_app NOLOGIN. Give it a login for the test run only.
  const owner = new PrismaClient({ adapter: new PrismaPg({ connectionString: DIRECT_URL }) });
  try {
    await owner.$executeRaw`alter role eskool_app with login password 'eskool_app'`;
  } finally {
    await owner.$disconnect();
  }
}
