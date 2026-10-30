# E-skool

ERP for private primary schools in Douala. This repository is the platform baseline: a Next.js app that reads the database and shows its Postgres version.

## Run locally

Requirements: Node 24+, Docker.

```sh
npm ci
docker compose up -d        # Postgres 17 on localhost:5433 (5432 is often taken by a native Postgres)
cat > .env <<'EOF'
DATABASE_URL=postgresql://eskool_app:eskool_app@localhost:5433/eskool
DIRECT_URL=postgresql://eskool:eskool@localhost:5433/eskool
EOF
DIRECT_URL=postgresql://eskool:eskool@localhost:5433/eskool npx prisma migrate deploy  # owner; creates eskool_app NOLOGIN
docker compose exec db psql -U eskool -d eskool -c "alter role eskool_app with login password 'eskool_app'"  # local dev login only
npm run dev
```

## Environment

Two connection strings, read once in `src/config.ts` and validated at startup:

- `DATABASE_URL`: runtime, connects as the app role `eskool_app` (LOGIN, NOSUPERUSER, NOBYPASSRLS). Row level security applies to it. Local: `postgresql://eskool_app:eskool_app@localhost:5433/eskool`. Neon: the pooled host, role `eskool_app`.
- `DIRECT_URL`: the owner, non-pooled connection. Migrations and `prisma` CLI commands use it (`prisma.config.ts`). Local: `postgresql://eskool:eskool@localhost:5433/eskool`. Neon: the direct host without `-pooler`, owner role.

If `DATABASE_URL` is missing or invalid the app refuses to start and names the variable.

Neon, once, before the app takes traffic: run the first `prisma migrate deploy` as the owner (`DIRECT_URL`). It creates `eskool_app` as NOLOGIN, with no password in git. Then, as the owner, run `ALTER ROLE eskool_app WITH LOGIN PASSWORD '<generated secret>';`, and set `DATABASE_URL` in Vercel to that role's connection string. Never reuse the owner password for `DATABASE_URL`.

## Verify

```sh
npm run check      # lint, typecheck, unit tests (no database needed)
npm run test:db    # database tests against the running container
npm run build      # production build
```

CI (`.github/workflows/ci.yml`) runs the `app` job (lint, typecheck, test, build) and the `db` job (Postgres 17 service, `test:db`).

## Deploy

Vercel project imports this repository. Region is set in `vercel.json` (`fra1`). Production runs from `main`, previews from other branches. Set `DATABASE_URL` (and `DIRECT_URL`) in Vercel environment variables. Pushing to GitHub and creating the Vercel project are manual steps.
