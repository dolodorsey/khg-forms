create or replace function public.notify_khg_water_inquiry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_brand_key text := regexp_replace(new.source, '-direct-form$', '');
begin
  select id into v_org_id from public.organizations where organization_key='khg' and status='active' limit 1;
  if v_org_id is not null then
    insert into public.khg_notifications (
      organization_id, notification_type, title, body, entity_table, entity_id,
      brand_key, channel, status, metadata
    ) values (
      v_org_id,
      'water_inquiry',
      initcap(replace(v_brand_key,'-',' ')) || ': new ' || replace(new.inquiry_type,'-',' ') || ' inquiry',
      new.contact_name || ' · ' || new.company_name || ' · ' || new.phone,
      tg_table_name,
      new.id::text,
      v_brand_key,
      'in_app',
      'unread',
      jsonb_build_object('inquiry_type',new.inquiry_type,'email',new.email,'location',new.project_location,'source',new.source)
    );
  end if;
  return new;
end;
$$;

revoke all on function public.notify_khg_water_inquiry() from public, anon, authenticated;
grant execute on function public.notify_khg_water_inquiry() to postgres, service_role;

do $$
declare
  rec record;
  c record;
  policy_name text;
  index_prefix text;
begin
  for rec in select * from (values
    ('nativa_waterworks_inquiries','nativa-waterworks','nativa-waterworks-direct-form'),
    ('aquifer_waterworks_inquiries','aquifer-waterworks','aquifer-waterworks-direct-form'),
    ('infinity_water_inquiries','infinity-water','infinity-water-direct-form'),
    ('pronto_energy_inquiries','pronto-energy','pronto-energy-direct-form'),
    ('tribal_water_inquiries','tribal-water','tribal-water-direct-form')
  ) as brands(table_name, brand_key, source_value)
  loop
    execute format(
      'create table if not exists public.%I (
        id uuid primary key default gen_random_uuid(),
        inquiry_type text not null,
        contact_name text not null check (char_length(trim(contact_name)) between 2 and 120),
        job_title text,
        company_name text not null check (char_length(trim(company_name)) between 2 and 180),
        email text not null check (email ~* ''^[A-Z0-9._%%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$''),
        phone text not null check (char_length(regexp_replace(phone, ''[^0-9]'', '''', ''g'')) between 10 and 15),
        project_location text not null check (char_length(trim(project_location)) between 2 and 220),
        desired_start_date date,
        estimated_volume_gallons numeric check (estimated_volume_gallons is null or estimated_volume_gallons > 0),
        frequency text,
        water_requirements text,
        delivery_method text,
        procurement_stage text,
        details jsonb not null default ''{}''::jsonb,
        status text not null default ''new'' check (status in (''new'',''qualified'',''reviewing'',''quoted'',''contracting'',''won'',''lost'',''hold'')),
        source text not null default %L,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        constraint active_water_inquiry_type_allowed check (inquiry_type in (
          ''bulk-water'',''municipal'',''data-centers'',''private-label'',''emergency-supply'',
          ''distribution'',''partner'',''wholesale'',''hospitality'',''retail'',''events'',
          ''sponsorship'',''request-information''
        ))
      )', rec.table_name, rec.source_value
    );

    execute format('alter table public.%I enable row level security', rec.table_name);
    execute format('revoke all on table public.%I from anon, authenticated', rec.table_name);
    execute format('grant insert on table public.%I to anon, authenticated', rec.table_name);
    execute format('grant select, insert, update, delete on table public.%I to service_role', rec.table_name);

    policy_name := 'Public may submit ' || rec.brand_key || ' inquiries';
    execute format('drop policy if exists %I on public.%I', policy_name, rec.table_name);
    execute format('create policy %I on public.%I for insert to anon, authenticated with check (status=''new'' and source=%L)', policy_name, rec.table_name, rec.source_value);

    index_prefix := left(rec.table_name, 42);
    execute format('create index if not exists %I on public.%I (inquiry_type, created_at desc)', index_prefix || '_type_created_idx', rec.table_name);
    execute format('create index if not exists %I on public.%I (lower(company_name))', index_prefix || '_company_idx', rec.table_name);
    execute format('create index if not exists %I on public.%I (status, created_at desc)', index_prefix || '_status_idx', rec.table_name);

    execute format('drop trigger if exists trg_notify_khg_water_inquiry on public.%I', rec.table_name);
    execute format('create trigger trg_notify_khg_water_inquiry after insert on public.%I for each row execute function public.notify_khg_water_inquiry()', rec.table_name);
  end loop;

  execute 'drop trigger if exists trg_notify_khg_water_inquiry on public.everyday_water_group_inquiries';
  execute 'create trigger trg_notify_khg_water_inquiry after insert on public.everyday_water_group_inquiries for each row execute function public.notify_khg_water_inquiry()';
end
$$;
