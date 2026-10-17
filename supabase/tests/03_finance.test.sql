-- Finance: expenses, other income, cash position, day closing, locks,
-- adjustments, monthly report.
begin;

select tests.create_user('admin@test', 'admin');
select tests.create_user('owner@test', 'owner');
select tests.create_user('sec@test', 'secretary');

insert into public.school_years (id, label, is_current) values ('00000000-0000-0000-0000-0000000000a1', '2026-2027', true);
insert into public.classes (id, name) values ('00000000-0000-0000-0000-0000000000c1', 'CP');
insert into public.fee_schedules (school_year_id, class_id, fee, term, amount, due_date)
values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'tuition', 1, 100000, public.app_today() - 60);
insert into public.pupils (id, last_name, first_name) values ('00000000-0000-0000-0000-0000000000b1', 'ABENA', 'Sara');
insert into public.enrollments (pupil_id, school_year_id, class_id)
values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1');

select tests.login_as('admin@test');

do $$
declare
  v_today date := public.app_today();
  v_prev_month date := (date_trunc('month', public.app_today()) - interval '1 month')::date;
  v_cat uuid;
  v_exp uuid;
  v_old_exp uuid;
  v_pay uuid;
  r jsonb;
begin
  select id into v_cat from public.expense_categories where name = 'Divers';

  -- An expense last month (to lock that month later)
  v_old_exp := public.record_expense(v_cat, 2000, 'cash', v_prev_month + 3, 'Craies');

  -- Two days ago: payment 20000 cash; yesterday: expense 3000 cash, income 5000 cash, momo payment 7000
  r := public.record_payment('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1',
                             'tuition', 1::smallint, 20000, 'cash', null, v_today - 2);
  v_pay := (r ->> 'payment_id')::uuid;
  v_exp := public.record_expense(v_cat, 3000, 'cash', v_today - 1, 'Ampoules');
  perform public.record_other_income('Location salle', 5000, 'cash', v_today - 1, null);
  perform public.record_payment('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1',
                                'tuition', 1::smallint, 7000, 'orange_money', 'OM-1', v_today - 1);

  -- Expected cash at the end of yesterday: 2000 out last month, so 20000 + 5000 - 3000 - 2000
  r := public.cash_position(v_today - 1);
  perform tests.assert_eq((r ->> 'opening_cash')::int, 0, 'no previous closing');
  perform tests.assert_eq((r ->> 'expected_cash')::int, 20000, 'expected cash');

  -- Close yesterday: counted 19500 (500 missing), 15000 handed to the owner
  r := public.close_day(v_today - 1, 19500, 15000, 'Remis au fondateur');
  perform tests.assert_eq((r ->> 'difference')::int, -500, 'difference recorded');

  -- Today opens with 4500
  r := public.cash_position(v_today);
  perform tests.assert_eq((r ->> 'opening_cash')::int, 4500, 'opening from previous closing');

  -- Closed days are frozen for every kind of entry
  perform tests.assert_fails(format(
    $f$select public.record_payment('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'tuition', 1::smallint, 1000, 'cash', null, %L)$f$,
    v_today - 1), 'clôturée');
  perform tests.assert_fails(format($f$select public.void_payment(%L, 'erreur de saisie')$f$, v_pay), 'clôturée');
  perform tests.assert_fails(format($f$select public.void_expense(%L, 'erreur de saisie')$f$, v_exp), 'clôturée');
  perform tests.assert_fails(format($f$select public.record_expense(%L, 100, 'cash', %L, null)$f$, v_cat, v_today - 5), 'clôturée');
  perform tests.assert_fails(format($f$select public.close_day(%L, 0, 0, null)$f$, v_today - 1), 'déjà clôturée');
  perform tests.assert_fails(format($f$select public.close_day(%L, 0, 0, null)$f$, v_today + 1), 'future');
  perform tests.assert_fails(format($f$select public.close_day(%L, 100, 200, null)$f$, v_today), 'retiré');

  -- Today is still open
  r := public.record_payment('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1',
                             'tuition', 1::smallint, 1000, 'cash');
  perform tests.assert_eq(r ->> 'status', 'ok', 'today still open');

  -- Lock last month, then correct with an adjustment dated today
  perform public.lock_month(v_prev_month);
  perform tests.assert_fails(format($f$select public.lock_month(%L)$f$, v_today), 'mois terminé');
  perform public.record_adjustment('Craies remboursées', 2000, 'cash', v_prev_month);
  perform tests.assert_eq(
    (select amount_in from public.cash_book where source = 'adjustment'), 2000, 'adjustment in cash book');

  -- Monthly report for the current month
  r := public.monthly_report(v_today);
  perform tests.assert_eq((r ->> 'expenses_total')::int,
    case when date_trunc('month', v_today - 1) = date_trunc('month', v_today) then 3000 else 0 end, 'report expenses');
  perform tests.assert_eq((r ->> 'adjustments_total')::int, 2000, 'report adjustments');
  perform tests.assert_eq((r -> 'fees_by_method' ? 'cash'), true, 'report fees by method');

  -- Entries cannot be edited or deleted, even pending voids are one-way
  perform tests.assert_fails($f$update public.expenses set amount = 1$f$, 'permission denied');
  perform tests.assert_fails($f$delete from public.cash_closings$f$, 'permission denied');
end $$;

select tests.logout();
select tests.assert_fails($$update public.expenses set amount = 1$$, 'ne peut pas être modifiée');
select tests.assert_fails($$delete from public.expenses$$, 'ne peut pas être supprimée');
select tests.assert_fails($$delete from public.cash_closings$$, 'ne peuvent pas être modifiées');
select tests.assert_fails($$delete from public.adjustments$$, 'ne peut pas être modifié');

select tests.login_as('owner@test');
do $$ begin
  perform tests.assert_eq((select count(*) > 0 from public.cash_book), true, 'owner reads cash book');
  perform tests.assert_eq((public.monthly_report(public.app_today()) ? 'fees_total'), true, 'owner reads report');
end $$;
select tests.assert_fails($$select public.close_day(public.app_today(), 0, 0, null)$$, 'non autorisée');

select tests.login_as('sec@test');
do $$ begin
  perform tests.assert_eq((select count(*) from public.expenses)::int, 0, 'secretary sees no expenses');
end $$;
select tests.assert_fails($$select public.monthly_report(public.app_today())$$, 'non autorisée');
select tests.assert_fails($$select public.cash_position(public.app_today())$$, 'non autorisée');

rollback;
