-- Existing intake tables and insert-only policies are preserved.
-- This migration extends only the allowed form types required by the live routes
-- and adds KHG Dashboard notifications.

alter table public.nation_inquiries
  drop constraint if exists nation_inquiries_form_type_check;
alter table public.nation_inquiries
  add constraint nation_inquiries_form_type_check
  check (form_type in (
    'citizenship','personal-inquiry','membership','tribal-inquiry','business','tokens',
    'donate','sponsor','volunteer','personnel','request-information','create-account'
  ));

alter table public.hakuna_matata_inquiries
  drop constraint if exists hakuna_matata_inquiries_form_type_check;
alter table public.hakuna_matata_inquiries
  add constraint hakuna_matata_inquiries_form_type_check
  check (form_type in ('order','bulk-orders','speaking','book-club','media','general-inquiry'));

create index if not exists nation_inquiries_type_created_idx
  on public.nation_inquiries (form_type, created_at desc);
create index if not exists tribe_inquiries_type_created_idx
  on public.tribe_inquiries (form_type, created_at desc);
create index if not exists university_inquiries_type_created_idx
  on public.university_inquiries (form_type, created_at desc);
create index if not exists hakuna_matata_inquiries_type_created_idx
  on public.hakuna_matata_inquiries (form_type, created_at desc);

create or replace function public.notify_active_platform_inquiry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_brand_key text;
  v_name text;
begin
  v_brand_key := case tg_table_name
    when 'nation_inquiries' then 'nation'
    when 'tribe_inquiries' then 'tribe'
    when 'university_inquiries' then 'university'
    when 'hakuna_matata_inquiries' then 'hakuna-matata'
  end;
  v_name := case tg_table_name
    when 'nation_inquiries' then 'The Nation'
    when 'tribe_inquiries' then 'The Tribe'
    when 'university_inquiries' then 'The University'
    when 'hakuna_matata_inquiries' then 'Hakuna Matata'
  end;

  select id into v_organization_id
  from public.organizations
  where organization_key='khg' and status='active'
  limit 1;

  if v_organization_id is not null then
    insert into public.khg_notifications (
      organization_id, notification_type, title, body, entity_table,
      entity_id, brand_key, channel, status, metadata
    ) values (
      v_organization_id,
      'active_platform_inquiry',
      v_name || ': new ' || replace(new.form_type, '-', ' ') || ' inquiry',
      new.full_name || ' · ' || new.email || coalesce(' · ' || new.location, ''),
      tg_table_name,
      new.id::text,
      v_brand_key,
      'in_app',
      'unread',
      jsonb_build_object(
        'form_type',new.form_type,
        'email',new.email,
        'phone',new.phone,
        'source',new.source
      )
    );
  end if;

  return new;
end;
$$;

revoke all on function public.notify_active_platform_inquiry() from public, anon, authenticated;
grant execute on function public.notify_active_platform_inquiry() to postgres, service_role;

do $$
declare
  t text;
begin
  foreach t in array array[
    'nation_inquiries','tribe_inquiries','university_inquiries','hakuna_matata_inquiries'
  ]
  loop
    execute format('drop trigger if exists trg_notify_active_platform on public.%I', t);
    execute format(
      'create trigger trg_notify_active_platform after insert on public.%I for each row execute function public.notify_active_platform_inquiry()',
      t
    );
  end loop;
end $$;
