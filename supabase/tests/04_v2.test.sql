-- V2: enrollment applications, auto-reminder candidates, storage policies.
begin;

select tests.create_user('admin@test', 'admin');
select tests.create_user('sec@test', 'secretary');

insert into public.school_years (id, label, is_current) values ('00000000-0000-0000-0000-0000000000a1', '2026-2027', true);
insert into public.classes (id, name) values ('00000000-0000-0000-0000-0000000000c1', 'SIL');
insert into public.fee_schedules (school_year_id, class_id, fee, term, amount, due_date)
values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'tuition', 1, 60000, public.app_today() - 5);

select tests.login_as('sec@test');
do $$
declare v_app uuid; v_pupil uuid;
begin
  insert into public.enrollment_applications (child_last_name, child_first_name, parent_name, parent_phone, desired_class_id)
  values ('Nkolo', 'Iris', 'Mme Nkolo', '237655443322', '00000000-0000-0000-0000-0000000000c1')
  returning id into v_app;
  update public.enrollment_applications set status = 'accepted' where id = v_app;
  v_pupil := public.enroll_application(v_app, '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1');
  perform tests.assert_eq((select last_name from public.pupils where id = v_pupil), 'NKOLO', 'pupil created');
  perform tests.assert_eq((select status::text from public.enrollment_applications where id = v_app), 'enrolled', 'application enrolled');
  perform tests.assert_fails(format($f$select public.enroll_application(%L, '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1')$f$, v_app), 'déjà');
  perform tests.assert_fails($f$select public.due_auto_reminders(10)$f$, 'permission denied');
end $$;

-- Secretary cannot delete; admin can delete only non-enrolled applications
do $$
declare n int;
begin
  delete from public.enrollment_applications;
  get diagnostics n = row_count;
  perform tests.assert_eq(n, 0, 'secretary cannot delete applications');
end $$;

select tests.logout();
do $$
declare n int;
begin
  -- Candidate: overdue, has phone, never reminded
  perform tests.assert_eq((select count(*) from public.due_auto_reminders(10))::int, 1, 'one reminder candidate');
  insert into public.reminder_log (pupil_id, school_year_id, term, channel)
  select pupil_id, school_year_id, term, 'whatsapp_api' from public.due_auto_reminders(10);
  perform tests.assert_eq((select count(*) from public.due_auto_reminders(10))::int, 0, 'recently reminded is skipped');
end $$;

-- Storage policies: admin writes the expense receipts bucket, secretary cannot
select tests.login_as('admin@test');
insert into storage.objects (bucket_id, name) values ('expense-receipts', 'test/a.jpg');
select tests.login_as('sec@test');
select tests.assert_fails($$insert into storage.objects (bucket_id, name) values ('expense-receipts', 'test/b.jpg')$$, 'row-level security');
do $$ begin
  perform tests.assert_eq((select count(*) from storage.objects where bucket_id = 'expense-receipts')::int, 0, 'secretary cannot list receipts');
end $$;

rollback;
