create or replace function public.notify_khg_event_form_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_brand_key text := regexp_replace(coalesce(new.source, tg_table_name), '-direct-form$', '');
begin
  select id into v_organization_id
  from public.organizations
  where organization_key = 'khg'
    and status = 'active'
  limit 1;

  if v_organization_id is not null then
    insert into public.khg_notifications (
      organization_id,
      notification_type,
      title,
      body,
      entity_table,
      entity_id,
      brand_key,
      channel,
      status,
      metadata
    ) values (
      v_organization_id,
      'event_form_submission',
      initcap(replace(v_brand_key, '-', ' ')) || ': new ' || replace(new.form_type, '_', ' ') || ' request',
      trim(new.first_name || ' ' || new.last_name) || ' · ' || new.phone || ' · ' || coalesce(new.event_name, 'Event'),
      tg_table_name,
      new.id::text,
      v_brand_key,
      'in_app',
      'unread',
      jsonb_build_object(
        'form_type', new.form_type,
        'event_date', new.event_date,
        'guest_count', new.guest_count,
        'email', new.email,
        'source', new.source
      )
    );
  end if;

  return new;
end;
$$;

revoke all on function public.notify_khg_event_form_submission() from public, anon, authenticated;
grant execute on function public.notify_khg_event_form_submission() to postgres, service_role;

do $$
declare
  rec record;
  constraint_rec record;
  v_policy_name text;
  v_index_prefix text;
begin
  for rec in
    select * from (values
      ('grownish_form_submissions', 'grown-ish', 'grown-ish-direct-form'),
      ('rose_on_piedmont_form_submissions', 'rose-on-piedmont', 'rose-on-piedmont-direct-form'),
      ('taste_of_art_form_submissions', 'taste-of-art', 'taste-of-art-direct-form'),
      ('noir_form_submissions', 'noir', 'noir-direct-form'),
      ('remix_form_submissions', 'remix', 'remix-direct-form'),
      ('wrst_bhvr_form_submissions', 'wrst-bhvr', 'wrst-bhvr-direct-form'),
      ('the_kulture_form_submissions', 'the-kulture', 'the-kulture-direct-form'),
      ('paparazzi_form_submissions', 'paparazzi', 'paparazzi-direct-form'),
      ('sundays_best_form_submissions', 'sundays-best', 'sundays-best-direct-form'),
      ('gangsta_gospel_form_submissions', 'gangsta-gospel', 'gangsta-gospel-direct-form'),
      ('beauty_and_the_beast_form_submissions', 'beauty-and-the-beast', 'beauty-and-the-beast-direct-form'),
      ('cinco_de_drinko_form_submissions', 'cinco-de-drinko', 'cinco-de-drinko-direct-form'),
      ('secret_society_form_submissions', 'secret-society', 'secret-society-direct-form'),
      ('parking_lot_pimpin_form_submissions', 'parking-lot-pimpin', 'parking-lot-pimpin-direct-form'),
      ('pawchella_form_submissions', 'pawchella', 'pawchella-direct-form'),
      ('stella_form_submissions', 'stella', 'stella-direct-form'),
      ('forever_futbol_form_submissions', 'forever-futbol', 'forever-futbol-direct-form'),
      ('huglife_event_form_submissions', 'huglife', 'huglife-direct-form'),
      ('soul_sessions_form_submissions', 'soul-sessions', 'soul-sessions-direct-form'),
      ('black_ball_form_submissions', 'black-ball', 'black-ball-direct-form'),
      ('underground_king_form_submissions', 'underground-king', 'underground-king-direct-form'),
      ('cravings_form_submissions', 'cravings', 'cravings-direct-form'),
      ('diaspora_atl_form_submissions', 'diaspora-atl', 'diaspora-atl-direct-form'),
      ('freedom_fest_form_submissions', 'freedom-fest', 'freedom-fest-direct-form')
    ) as configured(table_name, brand_key, source_value)
  loop
    execute format(
      'create table if not exists public.%I (
        id uuid primary key default gen_random_uuid(),
        form_type text not null,
        first_name text not null check (char_length(trim(first_name)) between 1 and 80),
        last_name text not null check (char_length(trim(last_name)) between 1 and 80),
        email text not null check (email ~* ''^[A-Z0-9._%%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$''),
        phone text not null check (char_length(regexp_replace(phone, ''[^0-9]'', '''', ''g'')) between 10 and 15),
        event_name text,
        event_date date,
        guest_count integer check (guest_count between 1 and 1000),
        instagram_handle text,
        promo_code text,
        company_name text,
        details jsonb not null default ''{}''::jsonb,
        sms_consent boolean not null default false,
        status text not null default ''new'' check (status in (''new'',''reviewing'',''approved'',''declined'',''confirmed'',''waitlist'')),
        source text not null default %L,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )',
      rec.table_name,
      rec.source_value
    );

    for constraint_rec in
      select c.conname
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public'
        and t.relname = rec.table_name
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ilike '%form_type%'
    loop
      execute format('alter table public.%I drop constraint %I', rec.table_name, constraint_rec.conname);
    end loop;

    execute format(
      'alter table public.%I add constraint event_form_type_allowed
       check (form_type in (''rsvp'',''birthday'',''vendor'',''table'',''sponsor'',''media'',''volunteer'',''perform''))',
      rec.table_name
    );

    execute format('alter table public.%I enable row level security', rec.table_name);
    execute format('revoke all on table public.%I from anon, authenticated', rec.table_name);
    execute format('grant insert on table public.%I to anon, authenticated', rec.table_name);
    execute format('grant select, insert, update, delete on table public.%I to service_role', rec.table_name);

    v_policy_name := 'Public may submit ' || rec.brand_key || ' event forms';
    execute format('drop policy if exists %I on public.%I', v_policy_name, rec.table_name);
    execute format(
      'create policy %I on public.%I for insert to anon, authenticated
       with check (status = ''new'' and source = %L)',
      v_policy_name,
      rec.table_name,
      rec.source_value
    );

    v_index_prefix := left(rec.table_name, 42);
    execute format(
      'create index if not exists %I on public.%I (form_type, created_at desc)',
      v_index_prefix || '_type_created_idx',
      rec.table_name
    );
    execute format(
      'create index if not exists %I on public.%I (lower(email))',
      v_index_prefix || '_email_idx',
      rec.table_name
    );

    execute format('drop trigger if exists trg_notify_khg_event_form on public.%I', rec.table_name);
    execute format(
      'create trigger trg_notify_khg_event_form
       after insert on public.%I
       for each row execute function public.notify_khg_event_form_submission()',
      rec.table_name
    );
  end loop;
end
$$;
