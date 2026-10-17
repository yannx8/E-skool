# Operations

## Smoke checklist after each deploy (10 min, on a phone)
1. Log in as admin. Dashboard shows the setup checklist (fresh install) or KPIs.
2. Configuration > Années: create the year. Classes: add CP. Frais: one tuition amount + due date, save.
3. Élèves > Ajouter, with a parent phone. Then "Ajouter et encaisser".
4. Record 10 000 FCFA cash: receipt opens, amount in words correct, "Reste à payer" correct. Print preview A5.
5. Record the same payment again: duplicate warning appears.
6. "Annuler ce paiement" on the receipt (within 10 min): watermark ANNULÉ, pupil balance restored.
7. Impayés: pupil listed, "Relancer" opens WhatsApp with the message, row shows "Relancé aujourd'hui".
8. Fiche élève > "Lien de suivi parent": open in a private window, balances visible.
9. Configuration > Journal d'audit shows the steps above.
10. Configuration > Sauvegardes: "Télécharger toutes les données" downloads a zip.

## Scheduled jobs (vercel.json)
- `/api/cron/backup` Mondays 05:00 UTC: zip of all tables to the private `backups` bucket (12 kept), emailed to BACKUP_EMAIL; weekly figures to REPORT_EMAILS.
- `/api/cron/reminders` weekdays 08:00 UTC: automatic WhatsApp reminders, only if enabled in Configuration > Modules and WHATSAPP_* set; max 50/run; logs in `message_jobs` and `reminder_log`.
- Manual test: `curl -H "Authorization: Bearer $CRON_SECRET" https://<site>/api/cron/backup`.

## Migrations
New file in `supabase/migrations/` (timestamp prefix), test with `npm run test:db`, regenerate types with `npm run db:types`, push to main (CI applies it if the `SUPABASE_DB_URL` secret exists, otherwise `npm run setup`).

## Troubleshooting
- "Action non autorisée": user has no active row in `user_roles` (Configuration > Utilisateurs).
- Password reset email never arrives: Supabase default mailer only sends to project members; configure Resend SMTP (setup does it with SUPABASE_ACCESS_TOKEN).
- "La caisse est clôturée jusqu'au …": the day is closed; date the entry later or use an adjustment.
- Unverified values to check on first use: WhatsApp Cloud API version default (`v23.0`), Management API SMTP field formats in `scripts/setup.mjs`.
