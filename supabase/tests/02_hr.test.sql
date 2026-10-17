-- HR: salary history (append-only), payroll preparation, payment, payslips.
begin;

select tests.create_user('admin@test', 'admin');
select tests.create_user('owner@test', 'owner');
select tests.create_user('sec@test', 'secretary');

select tests.login_as('admin@test');

do $$
declare
  v_staff uuid;
  v_other uuid;
  v_month date := date_trunc('month', public.app_today())::date;
  v_entry uuid;
  v_number text;
  n int;
begin
  insert into public.staff (full_name, job_title, contract, phone, start_date)
  values ('Mme Ekane', 'Institutrice CP', 'permanent', '237677000001', v_month - 365)
  returning id into v_staff;
  insert into public.staff (full_name, job_title, contract) values ('M. Fouda', 'Gardien', 'part_time')
  returning id into v_other;

  -- BR7: raise = new row; latest effective on or before month end wins
  insert into public.staff_salary_history (staff_id, monthly_amount, effective_from)
  values (v_staff, 100000, v_month - 365), (v_staff, 120000, v_month);
  perform tests.assert_eq(public.salary_for_month(v_staff, v_month), 120000, 'raise applies this month');
  perform tests.assert_eq(public.salary_for_month(v_staff, (v_month - interval '1 month')::date), 100000, 'old salary last month');

  -- Staff without salary is skipped
  n := public.prepare_payroll(v_month);
  perform tests.assert_eq(n, 1, 'one payroll line prepared');
  perform tests.assert_eq(public.prepare_payroll(v_month), 0, 'prepare is idempotent');

  select id into v_entry from public.payroll_entries where staff_id = v_staff;
  perform public.update_payroll_entry(v_entry, 20000, 5000, 10000, 'Avance du 10');
  perform tests.assert_eq((select net_amount from public.payroll_entries where id = v_entry), 105000, 'net = base + bonus - advance - deduction');

  v_number := public.pay_payroll_entry(v_entry, 'cash', public.app_today());
  perform tests.assert_eq(v_number, 'BP-' || to_char(v_month, 'YYYYMM') || '-001', 'payslip number');
  perform tests.assert_eq((select status from public.payroll_entries where id = v_entry), 'paid', 'entry paid');

  -- Cash book sees the salary as money out
  perform tests.assert_eq(
    (select amount_out from public.cash_book where source = 'payroll' and source_id = v_entry), 105000, 'payroll in cash book');
end $$;

select tests.assert_fails($$select public.update_payroll_entry((select id from public.payroll_entries limit 1), 0, 0, 0, null)$$, 'déjà payé');
select tests.assert_fails($$select public.pay_payroll_entry((select id from public.payroll_entries limit 1), 'cash', null)$$, 'déjà payé');
select tests.assert_fails($$select public.delete_payroll_entry((select id from public.payroll_entries limit 1))$$, 'déjà payé');
select tests.assert_fails($$update public.staff_salary_history set monthly_amount = 1$$, 'permission denied');
select tests.assert_fails($$update public.payroll_entries set base_amount = 1$$, 'permission denied');

-- Net can't go negative
do $$
declare v_staff uuid; v_entry uuid;
begin
  select id into v_staff from public.staff where full_name = 'M. Fouda';
  insert into public.staff_salary_history (staff_id, monthly_amount, effective_from) values (v_staff, 30000, public.app_today() - 40);
  perform public.prepare_payroll(public.app_today());
  select id into v_entry from public.payroll_entries where staff_id = v_staff;
  perform tests.assert_fails(format('select public.update_payroll_entry(%L, 40000, 0, 0, null)', v_entry), 'check constraint');
  perform public.delete_payroll_entry(v_entry);
  perform tests.assert_eq((select count(*) from public.payroll_entries where staff_id = v_staff)::int, 0, 'pending entry deleted');
end $$;

select tests.login_as('owner@test');
do $$ begin
  perform tests.assert_eq((select count(*) from public.staff)::int, 2, 'owner reads staff');
end $$;
select tests.assert_fails($$select public.prepare_payroll(public.app_today())$$, 'non autorisée');

select tests.login_as('sec@test');
do $$ begin
  perform tests.assert_eq((select count(*) from public.staff)::int, 0, 'secretary sees no staff');
  perform tests.assert_eq((select count(*) from public.payroll_entries)::int, 0, 'secretary sees no payroll');
end $$;

rollback;
