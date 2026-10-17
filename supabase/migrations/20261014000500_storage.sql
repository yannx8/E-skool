-- =============================================================================
-- Storage buckets
--   branding          public   school logo shown on receipts and the portal
--   expense-receipts  private  photos of expense receipts (admin writes, owner reads)
--   backups           private  weekly CSV zip exports (service role only)
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('branding', 'branding', true, 2097152, array['image/png', 'image/jpeg', 'image/webp']),
  ('expense-receipts', 'expense-receipts', false, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('backups', 'backups', false, 52428800, array['application/zip'])
on conflict (id) do nothing;

create policy eskool_branding_select on storage.objects for select to authenticated
  using (bucket_id = 'branding');
create policy eskool_branding_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'branding' and (select public.auth_role()) = 'admin');
create policy eskool_branding_update on storage.objects for update to authenticated
  using (bucket_id = 'branding' and (select public.auth_role()) = 'admin')
  with check (bucket_id = 'branding' and (select public.auth_role()) = 'admin');
create policy eskool_branding_delete on storage.objects for delete to authenticated
  using (bucket_id = 'branding' and (select public.auth_role()) = 'admin');

create policy eskool_expense_receipts_select on storage.objects for select to authenticated
  using (bucket_id = 'expense-receipts' and (select public.auth_role()) in ('admin', 'owner'));
create policy eskool_expense_receipts_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'expense-receipts' and (select public.auth_role()) = 'admin');
