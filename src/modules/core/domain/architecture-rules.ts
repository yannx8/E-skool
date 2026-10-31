import { posix } from "node:path";

// AD-1 / AD-3 scanners. Pure: they take repo-relative POSIX paths and file sources, and
// return one message per problem. tests/architecture/boundaries.test.ts feeds the real tree.
export type SourceFile = { path: string; source: string };

const SPECIFIER = /\bfrom\s*["']([^"']+)["']|\bimport\s*\(?\s*["']([^"']+)["']/g;
const DEEP_MODULE_PATH = /^src\/modules\/([^/]+)\/(domain|data|application)(\/|$)/;

function resolveSpecifier(fromPath: string, specifier: string): string | null {
  if (specifier.startsWith("@/")) return posix.join("src", specifier.slice(2));
  if (specifier.startsWith(".")) return posix.join(posix.dirname(fromPath), specifier);
  return null;
}

// Nothing imports another module's domain/, data/ or application/: only its index.ts.
export function crossModuleImports(files: readonly SourceFile[]): string[] {
  const problems: string[] = [];
  for (const file of files) {
    for (const match of file.source.matchAll(SPECIFIER)) {
      const specifier = match[1] ?? match[2];
      const target = resolveSpecifier(file.path, specifier);
      const owner = target?.match(DEEP_MODULE_PATH)?.[1];
      if (owner && !file.path.startsWith(`src/modules/${owner}/`)) {
        problems.push(`${file.path}: imports ${specifier} (inside module ${owner})`);
      }
    }
  }
  return problems;
}

// A write method on a Prisma receiver (`tx`, `db`, `prisma`, `getDb()`, optionally `.model`),
// or raw execution. `map.delete(k)` and `cookies().delete(...)` are not Prisma. The `$` is
// split from "executeRaw" so this file does not match itself.
const PRISMA_WRITE = new RegExp(
  String.raw`\b(?:tx|db|prisma|getDb\(\))(?:\.\w+)?\.(?:create|update|upsert|delete|createMany|updateMany|deleteMany|createManyAndReturn|updateManyAndReturn)\s*\(|\$` +
    String.raw`execute(?:Raw|RawUnsafe)\b`,
);
const IN_DATA_LAYER = /^src\/modules\/[^/]+\/data\//;

// Prisma write calls live only in data/ layers.
export function prismaWritesOutsideData(files: readonly SourceFile[]): string[] {
  const problems: string[] = [];
  for (const file of files) {
    if (IN_DATA_LAYER.test(file.path)) continue;
    file.source.split("\n").forEach((line, index) => {
      if (PRISMA_WRITE.test(line)) problems.push(`${file.path}:${index + 1}: Prisma write outside data/`);
    });
  }
  return problems;
}

// Every schema model is listed in prisma/ownership.ts, and every entry there is a schema model.
export function modelsWithoutOwner(schema: string, ownership: Readonly<Record<string, string>>): string[] {
  const models = [...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map((match) => match[1]);
  return [
    ...models
      .filter((model) => !Object.hasOwn(ownership, model))
      .map((model) => `${model}: missing from prisma/ownership.ts`),
    ...Object.keys(ownership)
      .filter((model) => !models.includes(model))
      .map((model) => `${model}: in prisma/ownership.ts but not in the schema`),
  ];
}
