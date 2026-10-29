# E-skool

ERP for private primary schools in Douala. This repository is the platform baseline: a Next.js app that reads the database and shows its Postgres version.

## Run locally

Requirements: Node 24+, Docker.

```sh
npm ci
docker compose up -d        # Postgres 17 on localhost:5433 (5432 is often taken by a native Postgres)
cat > .env <<'EOF'
DATABASE_URL=postgresql://eskool:eskool@localhost:5433/eskool
DIRECT_URL=postgresql://eskool:eskool@localhost:5433/eskool
EOF
npm run dev
```

## Environment

Two variables, read once in `src/config.ts` and validated at startup:

- `DATABASE_URL`: runtime connection string (`postgresql://...`). Local: `postgresql://eskool:eskool@localhost:5433/eskool`. Neon: the pooled host.
- `DIRECT_URL`: direct (non-pooled) connection string, for migrations. Optional until migrations exist. Local: same as `DATABASE_URL`. Neon: the direct host without `-pooler`.

If `DATABASE_URL` is missing or invalid the app refuses to start and names the variable.

## Verify

```sh
npm run check      # lint, typecheck, unit tests (no database needed)
npm run test:db    # database tests against the running container
npm run build      # production build
```

CI (`.github/workflows/ci.yml`) runs the `app` job (lint, typecheck, test, build) and the `db` job (Postgres 17 service, `test:db`).

## Deploy

Vercel project imports this repository. Region is set in `vercel.json` (`fra1`). Production runs from `main`, previews from other branches. Set `DATABASE_URL` (and `DIRECT_URL`) in Vercel environment variables. Pushing to GitHub and creating the Vercel project are manual steps.
