create table if not exists public.everyday_water_group_inquiries (
  id uuid primary key default gen_random_uuid(),
  inquiry_type text not null check (inquiry_type in ('bulk-water','municipal','data-centers','private-label','emergency-supply','distribution','partner','request-information')),
  contact_name text not null check (char_length(trim(contact_name)) between 2 and 120),
  job_title text,
  company_name text not null check (char_length(trim(company_name)) between 2 and 180),
  email text not null check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  phone text not null check (char_length(regexp_replace(phone, '[^0-9]', '', 'g')) between 10 and 15),
  project_location text not null check (char_length(trim(project_location)) between 2 and 220),
  desired_start_date date,
  estimated_volume_gallons numeric check (estimated_volume_gallons is null or estimated_volume_gallons > 0),
  frequency text,
  water_requirements text,
  delivery_method text,
  procurement_stage text,
  details jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new','qualified','reviewing','quoted','contracting','won','lost','hold')),
  source text not null default 'everyday-water-group-direct-form',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.everyday_water_group_inquiries enable row level security;
revoke all on table public.everyday_water_group_inquiries from anon, authenticated;
grant insert on table public.everyday_water_group_inquiries to anon, authenticated;
grant select, insert, update, delete on table public.everyday_water_group_inquiries to service_role;

create index if not exists ewg_inquiries_type_created_idx on public.everyday_water_group_inquiries (inquiry_type, created_at desc);
create index if not exists ewg_inquiries_company_idx on public.everyday_water_group_inquiries (lower(company_name));
create index if not exists ewg_inquiries_status_idx on public.everyday_water_group_inquiries (status, created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='everyday_water_group_inquiries'
      and policyname='Public may submit Everyday Water inquiries'
  ) then
    create policy "Public may submit Everyday Water inquiries"
      on public.everyday_water_group_inquiries
      for insert to anon, authenticated
      with check (status='new' and source='everyday-water-group-direct-form');
  end if;
end
$$;
