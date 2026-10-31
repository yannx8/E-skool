import { defineConfig } from "prisma/config";

// The CLI (migrate, db pull) uses the direct, non-pooled owner connection.
// The runtime uses DATABASE_URL as the non-BYPASSRLS app role (see src/config.ts).
// Not env("DIRECT_URL"): that throws at config load, which breaks `prisma generate`
// in postinstall where no database is configured. generate never connects; migrate
// with an empty URL fails with Prisma's own error.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL ?? "",
  },
});
