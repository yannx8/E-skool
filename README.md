# E-skool

School management for a primary school in Douala: pupils, fees, payments and receipts, unpaid list with WhatsApp reminders, staff and payroll, expenses, cash book and daily cash closing, owner reports, enrollment pipeline and a read-only parent page. French UI, FCFA, mobile first.

Stack: Next.js 16 (App Router, server actions) on Vercel, Supabase (Postgres, Auth, Storage). No other backend.

## Going live (your part: accounts and environment variables)

Plan about 45 minutes. Everything else is automated by `npm run setup`.

1. **Supabase project.** Create a new project at supabase.com, region **eu-west-3 (Paris)** (closest to Douala). Do not reuse the existing `school-fees` project: it holds a different schema from an earlier prototype.
2. **Fill `.env.local`.** `cp .env.example .env.local`, then fill the REQUIRED and SETUP blocks. Where to find each value:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`: Supabase > Project Settings > API Keys.
   - `SUPABASE_DB_URL`: Supabase > Connect > "Session pooler" URI (replace `[YOUR-PASSWORD]`, percent-encode special characters).
   - `SUPABASE_ACCESS_TOKEN` (recommended): supabase.com/dashboard/account/tokens. Lets setup disable public sign-up and configure emails for you.
   - `CRON_SECRET`: run `openssl rand -hex 32`.
   - `NEXT_PUBLIC_SITE_URL`: the Vercel address from step 4 (you can fill it after the first deploy and re-run setup).
   - Email (recommended): create a Resend account, verify a domain, put the API key in `RESEND_API_KEY` and a sender like `Ecole <ecole@votredomaine.cm>` in `EMAIL_FROM`.
3. **Run setup** (Node 22.9+): `npm install && npm run setup`. It applies the database migrations, disables public sign-up, sets the password-reset URL, routes auth emails through Resend, creates the admin account and prints the list of variables for Vercel. Safe to run again.
4. **Deploy on Vercel.** Import the GitHub repo, paste the variables printed by setup (Production), deploy. Crons (weekly backup, daily reminders) are declared in `vercel.json`. The function region is Paris (`cdg1`).
5. **Optional: automatic migrations.** Add `SUPABASE_DB_URL` as a GitHub Actions secret; every push to `main` then applies new migrations after tests pass.

Then sign in with `ADMIN_EMAIL`. The dashboard shows a 3-step checklist: classes, fees, pupils (Excel import supported).

### If you skip `SUPABASE_ACCESS_TOKEN`
Do by hand in Supabase > Authentication: turn off "Allow new users to sign up"; set Site URL to your Vercel address and add `https://<your-domain>/**` to Redirect URLs; for password-reset emails to reach non-members, configure custom SMTP (Resend: host `smtp.resend.com`, port 465, user `resend`, password = API key).

### Modules
HR, Finance and Enrollment are **off by default**, following the plan's gates (V1.0 first, used for 2 weeks). Turn them on in Configuration > Modules. Automatic WhatsApp reminders need a Meta WhatsApp Business account and an approved template (see `.env.example`); manual "Relancer" buttons work without it.

## Development

```bash
npm install
npm run dev          # needs NEXT_PUBLIC_SUPABASE_* in .env.local
npm run check        # lint + typecheck + unit tests
npm run test:db      # SQL tests against a throwaway local Postgres (PGHOST/PGPORT/PGUSER)
npm run db:types     # regenerate src/lib/database.types.ts (TYPES_DB_URL)
```

Project context for future work (decisions, rules, open assumptions): `CLAUDE.md` and `docs/context/`.
