import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(["src/generated/**", ".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    // AD-7: "today" comes only from core/domain/clock.ts.
    files: ["src/modules/**/*.{ts,tsx,mts,cts}"],
    ignores: ["src/modules/core/domain/clock.ts", "**/*.test.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...[
          "NewExpression[callee.name='Date']",
          "NewExpression[callee.property.name='Date']",
          "CallExpression[callee.name='Date']",
          "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          "CallExpression[callee.object.property.name='Date'][callee.property.name='now']",
        ].map((selector) => ({
          selector,
          message: "Use nowInstant() / todayDouala() from core/domain/clock.ts (AD-7).",
        })),
      ],
    },
  },
]);
