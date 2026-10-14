-- Core: payments, receipts, voids, duplicates, balances, carry, discounts,
-- roles and grants. Dates are relative to app_today() so the test never ages.
begin;

select tests.create_user('admin@test', 'admin');
select tests.create_user('owner@test', 'owner');
select tests.create_user('sec@test', 'secretary');
select tests.create_user('nobody@test', null);

insert into public.school_years (id, label, is_current) values
  ('00000000-0000-0000-0000-0000000000a1', '2026-2027', true),
  ('00000000-0000-0000-0000-0000000000a2', '2027-2028', false);
insert into public.classes (id, name, sort_order) values
  ('00000000-0000-0000-0000-0000000000c1', 'CP', 1),
  ('00000000-0000-0000-0000-0000000000c2', 'CE1', 2);
insert into public.fee_schedules (school_year_id, class_id, fee, term, amount, due_date) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'tuition', 1, 50000, public.app_today() - 10),
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'tuition', 2, 40000, public.app_today() + 90),
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'tuition', 3, 40000, public.app_today() + 180),
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'registration', null, 10000, public.app_today() - 30);
insert into public.pupils (id, last_name, first_name, parent_name, parent_phone) values
  ('00000000-0000-0000-0000-0000000000b1', 'MBA', 'Élodie', 'Mme Mba', '237677123456'),
  ('00000000-0000-0000-0000-0000000000b2', 'NGONO', 'Paul', 'M. Ngono', '237699000111');
insert into public.enrollments (pupil_id, school_year_id, class_id) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1');

-- Phone normalization
do $$ begin
  perform tests.assert_eq(public.normalize_cm_phone('6 77 12 34 56'), '237677123456', 'phone spaces');
  perform tests.assert_eq(public.normalize_cm_phone('+237 677-12-34-56'), '237677123456', 'phone +237');
  perform tests.assert_eq(public.normalize_cm_phone('00237677123456'), '237677123456', 'phone 00237');
  perform tests.assert_eq(public.normalize_cm_phone('237677123456'), '237677123456', 'phone 237');
  perform tests.assert_eq(public.normalize_cm_phone('222123456'), null::text, 'landline rejected');
  perform tests.assert_eq(public.normalize_cm_phone('67712345'), null::text, 'too short');
  perform tests.assert_eq(public.normalize_text('  Élodie   MBA '), 'elodie mba', 'normalize_text');
end $$;

-- ---------------------------------------------------------------- admin flows
select tests.login_as('admin@test');

do $$
declare r jsonb; v_id uuid; v_dup_id uuid;
begin
  -- Before any payment
  perform tests.assert_eq(
    (select status from public.balance_lines where pupil_id = '00000000-0000-0000-0000-0000000000b1' and term = 1),
    'insolvable', 'unpaid overdue term is insolvable');
  perform tests.assert_eq(
    (select status from public.balance_lines where pupil_id = '00000000-0000-0000-0000-0000000000b1' and term = 2),
    'pas_encore_du', 'unpaid future term is pas encore du');

  -- J1: record a payment
  r := public.record_payment('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1',
                             'tuition', 1::smallint, 30000, 'cash');
  perform tests.assert_eq(r ->> 'status', 'ok', 'first payment ok');
  perform tests.assert_eq(r ->> 'receipt_number', '2026-0001', 'first receipt number');
  perform tests.assert_eq(
    (select row(due, applied, remaining, status)::text from public.balance_lines
     where pupil_id = '00000000-0000-0000-0000-0000000000b1' and term = 1),
    '(50000,30000,20000,partiel)', 'partial payment');

  -- FR-Y5: same pupil, amount, date, method -> duplicate warning, nothing inserted
  r := public.record_payment('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1',
                             'tuition', 1::smallint, 30000, 'cash');
  perform tests.assert_eq(r ->> 'status', 'duplicate', 'duplicate detected');
  perform tests.assert_eq(jsonb_array_length(r -> 'duplicates'), 1, 'one duplicate listed');
  perform tests.assert_eq((select count(*) from public.payments)::int, 1, 'duplicate not inserted');

  -- Forced duplicate goes through
  r := public.record_payment('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1',
                             'tuition', 1::smallint, 30000, 'cash', p_force => true);
  perform tests.assert_eq(r ->> 'receipt_number', '2026-0002', 'forced duplicate gets next number');
  v_dup_id := (r ->> 'payment_id')::uuid;

  -- Overpay term 1 by mobile money with a reference
  r := public.record_payment('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1',
                             'tuition', 1::smallint, 30000, 'mtn_momo', ' MP123 ');
  perform tests.assert_eq(r ->> 'status', 'ok', 'overpayment allowed (FR-Y6)');
  perform tests.assert_eq((select reference from public.payments where receipt_number = '2026-0003'), 'MP123', 'reference trimmed');

  -- Term 1 paid 90000 for 50000 due: 40000 carried to term 2 (BR5), which is now fully covered
  perform tests.assert_eq(
    (select row(paid, applied, carry_out, remaining, status)::text from public.balance_lines
     where pupil_id = '00000000-0000-0000-0000-0000000000b1' and term = 1),
    '(90000,50000,40000,0,solvable)', 'term 1 carry out');
  perform tests.assert_eq(
    (select row(paid, carry_in, applied, remaining, status)::text from public.balance_lines
     where pupil_id = '00000000-0000-0000-0000-0000000000b1' and term = 2),
    '(0,40000,40000,0,solvable)', 'term 2 covered by carry');
  perform tests.assert_eq(
    (select row(applied, remaining, status)::text from public.balance_lines
     where pupil_id = '00000000-0000-0000-0000-0000000000b1' and term = 3),
    '(0,40000,pas_encore_du)', 'term 3 untouched');

  -- Same reference on another pupil, different case -> duplicate
  r := public.record_payment('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a1',
                             'tuition', 1::smallint, 5000, 'mtn_momo', 'mp123');
  perform tests.assert_eq(r ->> 'status', 'duplicate', 'reference reuse detected across pupils');

  -- J4: void the forced duplicate
  perform public.void_payment(v_dup_id, 'erreur de saisie');
  perform tests.assert_eq(
    (select row(paid, carry_out)::text from public.balance_lines
     where pupil_id = '00000000-0000-0000-0000-0000000000b1' and term = 1),
    '(60000,10000)', 'voided payment no longer counts (BR2)');
  perform tests.assert_eq(
    (select row(applied, remaining, status)::text from public.balance_lines
     where pupil_id = '00000000-0000-0000-0000-0000000000b1' and term = 2),
    '(10000,30000,partiel)', 'carry reduced after void');
  perform tests.assert_eq((select voided_by from public.payments where id = v_dup_id), auth.uid(), 'voided_by set');

  -- BR4: receipt numbers never reused after a void
  r := public.record_payment('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1',
                             'registration', null, 10000, 'orange_money');
  perform tests.assert_eq(r ->> 'receipt_number', '2026-0004', 'numbering continues after void');

  -- Year totals and credit
  perform tests.assert_eq(
    (select row(due, paid, remaining, credit)::text from public.pupil_year_balance
     where pupil_id = '00000000-0000-0000-0000-0000000000b1'),
    '(140000,70000,70000,0)', 'year balance');
end $$;

-- Errors
select tests.assert_fails($$select public.void_payment((select id from public.payments where voided limit 1), 'encore une fois')$$, 'déjà annulé');
select tests.assert_fails($$select public.void_payment((select id from public.payments where not voided limit 1), 'non')$$, '5 caractères');
select tests.assert_fails($$select public.record_payment('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'tuition', 1::smallint, 1000, 'cash', null, public.app_today() + 1)$$, 'futur');
select tests.assert_fails($$select public.record_payment('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'tuition', 4::smallint, 1000, 'cash')$$, 'Aucun frais');
select tests.assert_fails($$select public.record_payment('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a2', 'tuition', 1::smallint, 1000, 'cash')$$, 'pas inscrit');
select tests.assert_fails($$select public.record_payment('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'tuition', 1::smallint, 0, 'cash')$$, 'supérieur à zéro');

-- Money tables are not writable directly, even by the admin
select tests.assert_fails($$update public.payments set amount = 1$$, 'permission denied');
select tests.assert_fails($$delete from public.payments$$, 'permission denied');
select tests.assert_fails($$insert into public.payments (pupil_id, school_year_id, term, amount, method, receipt_number) values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 1, 5, 'cash', 'x')$$, 'permission denied');
select tests.assert_fails($$delete from public.pupils$$, 'permission denied');
select tests.assert_fails($$select public.next_counter('receipt:hack')$$, 'permission denied');
select tests.assert_fails($$update public.audit_log set action = 'DELETE'$$, 'permission denied');
select tests.assert_fails($$insert into public.audit_log (table_name, action) values ('x', 'INSERT')$$, 'permission denied');

-- Fee schedule with payments cannot be deleted; an unused one can
select tests.assert_fails($$delete from public.fee_schedules where term = 1 and class_id = '00000000-0000-0000-0000-0000000000c1'$$, 'Des paiements existent');
do $$ begin
  insert into public.fee_schedules (school_year_id, class_id, fee, term, amount, due_date)
  values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c2', 'books', null, 7000, public.app_today());
  delete from public.fee_schedules where fee = 'books';
  perform tests.assert_eq((select count(*) from public.fee_schedules where fee = 'books')::int, 0, 'unused schedule deleted');
end $$;

-- Unique one-off fee per class (nulls not distinct)
select tests.assert_fails($$insert into public.fee_schedules (school_year_id, class_id, fee, term, amount, due_date) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'registration', null, 1, public.app_today())$$, 'fee_schedules_unique');

-- Discounts: 50% on tuition for pupil 2
do $$ begin
  insert into public.discounts (pupil_id, school_year_id, fee, kind, value, reason)
  values ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a1', 'tuition', 'percent', 50, 'Réduction fratrie');
  perform tests.assert_eq(
    (select row(gross_due, discount, due)::text from public.balance_lines
     where pupil_id = '00000000-0000-0000-0000-0000000000b2' and term = 1),
    '(50000,25000,25000)', 'percent discount');
  perform tests.assert_eq(
    (select due from public.balance_lines where pupil_id = '00000000-0000-0000-0000-0000000000b2' and fee = 'registration'),
    10000, 'discount limited to tuition');
end $$;

-- Search: accent-insensitive, by phone digits
do $$ begin
  perform tests.assert_eq(
    (select count(*) from public.search_pupils('elodie', '00000000-0000-0000-0000-0000000000a1'))::int, 1, 'search accent-insensitive');
  perform tests.assert_eq(
    (select last_name from public.search_pupils('0001 11', '00000000-0000-0000-0000-0000000000a1')), 'NGONO', 'search by phone digits');
  perform tests.assert_eq(
    (select remaining from public.search_pupils('mba', '00000000-0000-0000-0000-0000000000a1')), 70000, 'search returns remaining');
end $$;

-- Import (FR-P3)
do $$
declare r jsonb;
begin
  r := public.import_pupils('00000000-0000-0000-0000-0000000000a1', '[
    {"last_name": "Etoa", "first_name": "Marc", "class_name": "ce1", "parent_phone": "699 11 22 33"},
    {"last_name": "Biya", "first_name": "Anne", "class_name": "CM2"},
    {"last_name": "Owona", "first_name": "Luc", "class_name": "CP", "parent_phone": "12345"},
    {"last_name": "mba", "first_name": "elodie", "class_name": "CP"},
    {"last_name": "", "first_name": "X", "class_name": "CP"}
  ]'::jsonb);
  perform tests.assert_eq((r ->> 'inserted')::int, 1, 'import inserted');
  perform tests.assert_eq(jsonb_array_length(r -> 'rejected'), 4, 'import rejected');
  perform tests.assert_eq(r -> 'rejected' -> 0 ->> 'reason', 'Classe inconnue : "CM2"', 'unknown class reason');
  perform tests.assert_eq((r -> 'rejected' -> 2 ->> 'reason'), 'Élève déjà inscrit dans cette classe', 'duplicate reason');
  perform tests.assert_eq((select parent_phone from public.pupils where last_name = 'ETOA'), '237699112233', 'import normalizes phone and uppercases name');
end $$;

-- Create pupil + enrollment atomically; duplicate name in the same year refused
do $$
declare v_id uuid;
begin
  v_id := public.create_pupil('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c2',
                              ' tchoua ', 'Jean', 'M. Tchoua', '237670000000', null, null);
  perform tests.assert_eq((select last_name from public.pupils where id = v_id), 'TCHOUA', 'create_pupil uppercases');
  perform tests.assert_eq((select count(*) from public.enrollments where pupil_id = v_id)::int, 1, 'create_pupil enrolls');
  perform tests.assert_fails($f$select public.create_pupil('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'TCHOUA', 'jean')$f$, 'déjà inscrit');
  perform tests.assert_fails($f$select public.create_pupil('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'X', 'Y', null, '12345')$f$, 'parent_phone_check');
end $$;

-- Year rollover (J3): copy fees, promote, switch current year
do $$
declare r jsonb; n int;
begin
  n := public.copy_fee_schedules('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a2');
  perform tests.assert_eq(n, 4, 'fee schedules copied');
  perform tests.assert_eq(
    (select due_date from public.fee_schedules where school_year_id = '00000000-0000-0000-0000-0000000000a2' and fee = 'registration'),
    (public.app_today() - 30 + interval '1 year')::date, 'due date shifted one year');
  perform tests.assert_eq(public.copy_fee_schedules('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a2'), 0, 'copy is idempotent');

  r := public.promote_pupils('00000000-0000-0000-0000-0000000000a2', '[
    {"pupil_id": "00000000-0000-0000-0000-0000000000b1", "class_id": "00000000-0000-0000-0000-0000000000c2"},
    {"pupil_id": "00000000-0000-0000-0000-0000000000b2", "class_id": null}
  ]'::jsonb);
  perform tests.assert_eq(r::text, '{"left": 1, "skipped": 0, "enrolled": 1}', 'promotion counts');
  perform tests.assert_eq((select is_active from public.pupils where id = '00000000-0000-0000-0000-0000000000b2'), false, 'leaver deactivated');
  r := public.promote_pupils('00000000-0000-0000-0000-0000000000a2', '[
    {"pupil_id": "00000000-0000-0000-0000-0000000000b1", "class_id": "00000000-0000-0000-0000-0000000000c2"}]'::jsonb);
  perform tests.assert_eq((r ->> 'skipped')::int, 1, 'already enrolled is skipped');

  perform public.set_current_year('00000000-0000-0000-0000-0000000000a2');
  perform tests.assert_eq((select label from public.school_years where is_current), '2027-2028', 'current year switched');
  perform public.set_current_year('00000000-0000-0000-0000-0000000000a1');
end $$;

-- Dashboard
do $$
declare s jsonb := public.dashboard_stats('00000000-0000-0000-0000-0000000000a1');
begin
  perform tests.assert_eq((s ->> 'paid')::int, 70000, 'dashboard paid');
  perform tests.assert_eq((s ->> 'fee_schedules')::int, 4, 'dashboard schedule count');
  perform tests.assert_eq(jsonb_array_length(s -> 'terms'), 4, 'dashboard has 3 terms + one-off');
end $$;

-- Reminder log: insert own row only
do $$ begin
  insert into public.reminder_log (pupil_id, school_year_id, term, amount_due)
  values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 2, 30000);
  perform tests.assert_eq(
    (select last_reminded_at is not null from public.pupil_term_balance
     where pupil_id = '00000000-0000-0000-0000-0000000000b1' and term = 2), true, 'last reminded shown');
end $$;

-- Last admin cannot be demoted
select tests.assert_fails($$update public.user_roles set role = 'owner' where user_id = auth.uid()$$, 'permission denied');
select tests.logout();
select tests.assert_fails($$update public.user_roles set is_active = false where role = 'admin'$$, 'au moins un administrateur');

-- ------------------------------------------------------------ secretary
select tests.login_as('sec@test');
do $$
declare r jsonb;
begin
  r := public.record_payment('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1',
                             'tuition', 3::smallint, 1000, 'cash');
  perform tests.assert_eq(r ->> 'status', 'ok', 'secretary records payments');
  perform tests.assert_eq((select count(*) from public.audit_log)::int, 0, 'secretary cannot read audit log');
end $$;
select tests.assert_fails($$select public.void_payment((select id from public.payments where not voided limit 1), 'motif valable')$$, 'non autorisée');
select tests.assert_fails($$insert into public.classes (name) values ('CM1')$$, 'row-level security');
do $$
declare n int;
begin
  update public.settings set school_name = 'x';
  get diagnostics n = row_count;
  perform tests.assert_eq(n, 0, 'secretary cannot update settings');
end $$;

-- ------------------------------------------------------------ owner (read-only)
select tests.login_as('owner@test');
do $$ begin
  perform tests.assert_eq((select count(*) from public.payments)::int, 5, 'owner reads payments');
  perform tests.assert_eq((select count(*) > 0 from public.audit_log), true, 'owner reads audit log');
end $$;
select tests.assert_fails($$select public.record_payment('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'tuition', 3::smallint, 1000, 'cash')$$, 'non autorisée');
select tests.assert_fails($$insert into public.pupils (last_name) values ('X')$$, 'row-level security');

-- ------------------------------------------------------------ authenticated without role
select tests.login_as('nobody@test');
do $$ begin
  perform tests.assert_eq((select count(*) from public.payments)::int, 0, 'no role sees nothing');
  perform tests.assert_eq((select count(*) from public.pupils)::int, 0, 'no role sees no pupils');
end $$;
select tests.assert_fails($$select public.record_payment('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'tuition', 3::smallint, 1000, 'cash')$$, 'non autorisée');

-- ------------------------------------------------------------ anon
select tests.login_anon();
select tests.assert_fails($$select * from public.payments$$, 'permission denied');
select tests.assert_fails($$select * from public.pupils$$, 'permission denied');
select tests.assert_fails($$select public.dashboard_stats('00000000-0000-0000-0000-0000000000a1')$$, 'permission denied');
do $$
declare v_token text; r jsonb;
begin
  perform tests.logout();
  select portal_token into v_token from public.pupils where id = '00000000-0000-0000-0000-0000000000b1';
  perform tests.login_anon();
  r := public.parent_portal(v_token);
  perform tests.assert_eq(r -> 'pupil' ->> 'last_name', 'MBA', 'portal shows pupil');
  perform tests.assert_eq(r ->> 'class_name', 'CP', 'portal shows the current year enrollment');
  perform tests.assert_eq(r ? 'parent_phone', false, 'portal hides phone');
  perform tests.assert_eq(public.parent_portal('deadbeef'), null::jsonb, 'bad token returns null');
  perform tests.assert_eq(public.parent_portal(repeat('0', 32)), null::jsonb, 'unknown token returns null');
end $$;

-- ------------------------------------------------------------ postgres: immutability
select tests.logout();
select tests.assert_fails($$update public.payments set amount = 1 where receipt_number = '2026-0001'$$, 'ne peut pas être modifié');
select tests.assert_fails($$update public.payments set voided = false where voided$$, 'déjà annulé');
select tests.assert_fails($$delete from public.payments where receipt_number = '2026-0001'$$, 'ne peuvent pas être modifiées');
select tests.assert_fails($$delete from public.audit_log$$, 'ne peuvent pas être modifiées');
do $$ begin
  perform tests.assert_eq(
    (select count(*) from public.audit_log where table_name = 'payments' and action = 'UPDATE')::int, 1, 'void is audited');
  perform tests.assert_eq(
    (select user_id from public.audit_log where table_name = 'payments' order by id limit 1),
    tests.user_id('admin@test'), 'audit records the user');
end $$;

rollback;
