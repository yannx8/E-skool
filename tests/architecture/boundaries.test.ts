import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ownership } from "../../prisma/ownership";
import {
  type SourceFile,
  crossModuleImports,
  modelsWithoutOwner,
  prismaWritesOutsideData,
} from "../../src/modules/core/domain/architecture-rules";

// The real tree: every TypeScript file under src/ except Prisma's generated client.
const realTree: SourceFile[] = readdirSync("src", { recursive: true, encoding: "utf8" })
  .map((entry) => `src/${entry.replaceAll("\\", "/")}`)
  .filter((path) => /\.tsx?$/.test(path) && !path.startsWith("src/generated/"))
  .map((path) => ({ path, source: readFileSync(path, "utf8") }));

describe("crossModuleImports", () => {
  it("reports a planted deep import into another module, naming file and import", () => {
    const planted = [
      { path: "src/modules/core/application/x.ts", source: 'import { a } from "../../fees/data/charges";' },
      { path: "src/app/page.tsx", source: 'import { b } from "@/modules/fees/domain/balance";' },
      { path: "src/workflows/y.ts", source: 'const c = await import("../modules/academics/application/marks");' },
    ];
    expect(crossModuleImports(planted)).toEqual([
      "src/modules/core/application/x.ts: imports ../../fees/data/charges (inside module fees)",
      "src/app/page.tsx: imports @/modules/fees/domain/balance (inside module fees)",
      "src/workflows/y.ts: imports ../modules/academics/application/marks (inside module academics)",
    ]);
  });

  it("allows public index imports and imports within the same module", () => {
    const allowed = [
      { path: "src/app/page.tsx", source: 'import { databaseStatus } from "@/modules/core";' },
      { path: "src/modules/fees/application/z.ts", source: 'import { x } from "../data/charges";\nimport { y } from "../../core";' },
    ];
    expect(crossModuleImports(allowed)).toEqual([]);
  });

  it("finds none in the real tree", () => {
    expect(crossModuleImports(realTree)).toEqual([]);
  });
});

describe("prismaWritesOutsideData", () => {
  it("reports a planted write outside data/ and ignores data/", () => {
    const planted = [
      { path: "src/app/action.ts", source: "const x = 1;\nawait db.payment.create({ data });" },
      { path: "src/modules/fees/application/q.ts", source: "await tx.$executeRaw`delete from x`;" },
      { path: "src/modules/fees/data/payments.ts", source: "await tx.payment.updateMany({});" },
      { path: "src/app/data/x.ts", source: "await getDb().school.update({});" },
    ];
    expect(prismaWritesOutsideData(planted)).toEqual([
      "src/app/action.ts:2: Prisma write outside data/",
      "src/modules/fees/application/q.ts:1: Prisma write outside data/",
      "src/app/data/x.ts:1: Prisma write outside data/",
    ]);
  });

  it("ignores write-like calls on non-Prisma receivers", () => {
    const lookalikes = [
      {
        path: "src/app/actions.ts",
        source: [
          "map.delete(k);",
          'cookies().delete("lang");',
          'createHash("sha256").update(x);',
          "Object.create(null);",
          "ctx.create(1);",
        ].join("\n"),
      },
    ];
    expect(prismaWritesOutsideData(lookalikes)).toEqual([]);
  });

  it("finds none in the real tree", () => {
    expect(prismaWritesOutsideData(realTree)).toEqual([]);
  });
});

describe("modelsWithoutOwner", () => {
  it("reports a planted model missing from the ownership map", () => {
    const schema = "model School {\n  id String @id\n}\n\nmodel Payment {\n  id String @id\n}\n";
    expect(modelsWithoutOwner(schema, { School: "platform" })).toEqual(["Payment: missing from prisma/ownership.ts"]);
  });

  it("does not take a prototype key as an owner", () => {
    expect(modelsWithoutOwner("model constructor {\n}\n", {})).toEqual(["constructor: missing from prisma/ownership.ts"]);
  });

  it("reports a stale ownership entry", () => {
    expect(modelsWithoutOwner("model School {\n}\n", { School: "platform", Payment: "fees" })).toEqual([
      "Payment: in prisma/ownership.ts but not in the schema",
    ]);
  });

  it("finds none in the real schema", () => {
    expect(modelsWithoutOwner(readFileSync("prisma/schema.prisma", "utf8"), ownership)).toEqual([]);
  });
});
