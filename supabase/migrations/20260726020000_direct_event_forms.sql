update public.khg_form_configs
set is_active = false,
    updated_at = now()
where brand_key = 'sos'
  and is_active = true;

create table if not exists public.grownish_form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_type text not null check (form_type in ('rsvp','birthday','vendor','table','sponsor','media')),
  first_name text not null check (char_length(trim(first_name)) between 1 and 80),
  last_name text not null check (char_length(trim(last_name)) between 1 and 80),
  email text not null check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  phone text not null check (char_length(regexp_replace(phone, '[^0-9]', '', 'g')) between 10 and 15),
  event_name text,
  event_date date,
  guest_count integer check (guest_count between 1 and 1000),
  instagram_handle text,
  promo_code text,
  company_name text,
  details jsonb not null default '{}'::jsonb,
  sms_consent boolean not null default false,
  status text not null default 'new' check (status in ('new','reviewing','approved','declined','confirmed','waitlist')),
  source text not null default 'grownish-direct-form',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rose_on_piedmont_form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_type text not null check (form_type in ('rsvp','birthday','vendor','table','sponsor','media')),
  first_name text not null check (char_length(trim(first_name)) between 1 and 80),
  last_name text not null check (char_length(trim(last_name)) between 1 and 80),
  email text not null check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  phone text not null check (char_length(regexp_replace(phone, '[^0-9]', '', 'g')) between 10 and 15),
  event_name text,
  event_date date,
  guest_count integer check (guest_count between 1 and 1000),
  instagram_handle text,
  promo_code text,
  company_name text,
  details jsonb not null default '{}'::jsonb,
  sms_consent boolean not null default false,
  status text not null default 'new' check (status in ('new','reviewing','approved','declined','confirmed','waitlist')),
  source text not null default 'rose-on-piedmont-direct-form',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.grownish_form_submissions enable row level security;
alter table public.rose_on_piedmont_form_submissions enable row level security;

revoke all on table public.grownish_form_submissions from anon, authenticated;
revoke all on table public.rose_on_piedmont_form_submissions from anon, authenticated;
grant insert on table public.grownish_form_submissions to anon, authenticated;
grant insert on table public.rose_on_piedmont_form_submissions to anon, authenticated;
grant select, insert, update, delete on table public.grownish_form_submissions to service_role;
grant select, insert, update, delete on table public.rose_on_piedmont_form_submissions to service_role;

create index if not exists grownish_forms_type_created_idx on public.grownish_form_submissions (form_type, created_at desc);
create index if not exists grownish_forms_email_idx on public.grownish_form_submissions (lower(email));
create index if not exists rose_forms_type_created_idx on public.rose_on_piedmont_form_submissions (form_type, created_at desc);
create index if not exists rose_forms_email_idx on public.rose_on_piedmont_form_submissions (lower(email));

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='grownish_form_submissions' and policyname='Public may submit Grownish forms') then
    create policy "Public may submit Grownish forms"
      on public.grownish_form_submissions
      for insert to anon, authenticated
      with check (status='new' and source='grownish-direct-form');
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='rose_on_piedmont_form_submissions' and policyname='Public may submit Rose forms') then
    create policy "Public may submit Rose forms"
      on public.rose_on_piedmont_form_submissions
      for insert to anon, authenticated
      with check (status='new' and source='rose-on-piedmont-direct-form');
  end if;
end
$$;
