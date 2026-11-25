-- Team onboarding link + NDA signing v2. Not yet applied: waits for founder approval of the database change.

-- Team onboarding + NDA signing v2 (Nov 24 2026)
create table if not exists public.team_nda_versions (
  version_key text primary key,
  title text not null,
  body_template text not null,
  body_sha256 text not null,
  default_consideration text not null,
  governing_state text not null default 'Georgia',
  status text not null default 'draft' check (status in ('draft','approved','retired')),
  is_current boolean not null default false,
  change_notes text,
  approved_at timestamptz,
  approved_by text,
  created_at timestamptz not null default now()
);
create unique index if not exists team_nda_versions_one_current on public.team_nda_versions(is_current) where is_current;
alter table public.team_nda_versions enable row level security;
drop policy if exists "team_nda_versions service all" on public.team_nda_versions;
create policy "team_nda_versions service all" on public.team_nda_versions for all to service_role using (true) with check (true);

create table if not exists public.team_onboarding_entities (
  slug text primary key,
  display_name text not null,
  work_email_domain text,
  mail_ready boolean not null default false,
  sort_order integer not null default 100,
  active boolean not null default true,
  notes text,
  updated_at timestamptz not null default now()
);
alter table public.team_onboarding_entities enable row level security;
drop policy if exists "team_onboarding_entities service all" on public.team_onboarding_entities;
create policy "team_onboarding_entities service all" on public.team_onboarding_entities for all to service_role using (true) with check (true);

-- The top 15 entities teammates can pick (Nov 25 ask). Every name spelled out.
insert into public.team_onboarding_entities(slug, display_name, work_email_domain, mail_ready, sort_order, notes) values
 ('dorsey','Dr. Dorsey and The Kollective Hospitality Group','thekollectivehospitality.com',false,10,'Google Workspace; seats needed for real mailboxes'),
 ('sos','S.O.S. (Superheros On Standby)','superherosonstandby.com',true,20,'Hostinger'),
 ('good-times','Good Times','thegoodtimesworldwide.com',true,30,'Hostinger'),
 ('atf','American Track and Field','americantnf.com',true,40,'Google Workspace'),
 ('sole-exchange','Sole Exchange',null,false,50,'No mail domain yet'),
 ('inner-circle','The Inner Circle','houstatlantavegas.com',false,60,'Mailbox built, domain has no mail host yet'),
 ('memory-machine','Memory Machine',null,false,70,'No mail domain on file'),
 ('ball-series','The Ball Series',null,false,80,'No mail domain on file'),
 ('santa-in-atlanta','Santa in Atlanta',null,false,90,'No mail domain on file'),
 ('clothing','Clothing Brands (STUSH, FENYX, Bodega)','stushusa.com',false,100,'Domain has no mail host yet'),
 ('bevco','BEVCO Beverages (Infinity Water, Pronto Energy)',null,false,110,'No mail domain on file'),
 ('hood-news','Hood News',null,false,120,'No mail domain on file'),
 ('the-university','The University',null,false,130,'No mail domain on file'),
 ('members-elite','Member''s Elite',null,false,140,'No mail domain on file'),
 ('kollective-events','Kollective Hospitality Events','thekollectivehospitality.com',false,150,'Shares the flagship domain')
on conflict (slug) do nothing;

create table if not exists public.team_work_email_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.team_members(id) on delete cascade,
  entity_slug text references public.team_onboarding_entities(slug),
  requested_local_part text not null,
  domain text,
  requested_address text,
  status text not null default 'awaiting_founder_approval' check (status in ('awaiting_founder_approval','approved','created','declined','domain_not_ready')),
  decided_at timestamptz,
  decided_by text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_team_work_email_requests_member on public.team_work_email_requests(member_id);
alter table public.team_work_email_requests enable row level security;
drop policy if exists "team_work_email_requests service all" on public.team_work_email_requests;
create policy "team_work_email_requests service all" on public.team_work_email_requests for all to service_role using (true) with check (true);

alter table public.team_members
  add column if not exists entity_slug text,
  add column if not exists mailing_address text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_relationship text,
  add column if not exists emergency_contact_phone text,
  add column if not exists preferred_contact_method text,
  add column if not exists best_time_to_reach text,
  add column if not exists shirt_size text,
  add column if not exists hoodie_size text,
  add column if not exists pants_size text,
  add column if not exists shoe_size text,
  add column if not exists residence_city text,
  add column if not exists residence_state text,
  add column if not exists involved_entities text[] default '{}',
  add column if not exists interests text[] default '{}',
  add column if not exists interests_notes text,
  add column if not exists requested_work_email text,
  add column if not exists onboarding_source text,
  add column if not exists onboarding_submitted_at timestamptz;

alter table public.team_ndas
  add column if not exists nda_version_key text references public.team_nda_versions(version_key),
  add column if not exists nda_template_sha256 text,
  add column if not exists nda_rendered_sha256 text,
  add column if not exists nda_rendered_text text,
  add column if not exists signer_phone text,
  add column if not exists signer_entity text,
  add column if not exists signer_initials text,
  add column if not exists typed_signature_name text,
  add column if not exists signed_date_local date,
  add column if not exists signer_timezone text,
  add column if not exists electronic_consent boolean,
  add column if not exists read_to_end boolean,
  add column if not exists pdf_storage_path text,
  add column if not exists company_countersigned_at timestamptz,
  add column if not exists company_countersigned_by text;

create or replace function public.submit_team_onboarding(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  v_ver team_nda_versions%rowtype;
  v_ent team_onboarding_entities%rowtype;
  v_email text := lower(trim(coalesce(p->>'personal_email','')));
  v_name text := regexp_replace(trim(coalesce(p->>'full_name','')), '\s+', ' ', 'g');
  v_typed text := regexp_replace(trim(coalesce(p->>'typed_signature','')), '\s+', ' ', 'g');
  v_phone text := regexp_replace(coalesce(p->>'phone',''), '[^0-9+]', '', 'g');
  v_tz text := coalesce(nullif(p->>'timezone',''), 'America/New_York');
  v_local_part text := lower(trim(coalesce(p->>'work_email_local_part','')));
  v_member_id uuid;
  v_existing boolean := false;
  v_nda_id uuid;
  v_token text;
  v_signed_local date;
  v_request_status text;
  v_address text;
  v_involved text[];
  v_interests text[];
begin
  select * into v_ver from team_nda_versions where is_current;
  if not found then return jsonb_build_object('ok',false,'error','No current NDA version'); end if;
  if coalesce(p->>'nda_version_key','') <> v_ver.version_key or coalesce(p->>'nda_template_sha256','') <> v_ver.body_sha256 then
    return jsonb_build_object('ok',false,'error','The agreement changed while you were signing. Reload the page and sign the current version.');
  end if;
  if v_ver.status <> 'approved' and coalesce((p->>'preview_ok')::boolean,false) is not true then
    return jsonb_build_object('ok',false,'error','This onboarding link is not open yet.');
  end if;
  if length(v_name) < 3 or v_name !~ ' ' then return jsonb_build_object('ok',false,'error','Enter your full legal name (first and last).'); end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return jsonb_build_object('ok',false,'error','Enter a valid personal email.'); end if;
  if length(regexp_replace(v_phone,'[^0-9]','','g')) < 10 then return jsonb_build_object('ok',false,'error','Enter a valid mobile number.'); end if;
  select coalesce(array_agg(distinct x), '{}') into v_involved
    from jsonb_array_elements_text(case when jsonb_typeof(p->'involved_entities') = 'array' then p->'involved_entities' else '[]'::jsonb end) x
    where x in (select slug from team_onboarding_entities where active);
  if cardinality(v_involved) = 0 then return jsonb_build_object('ok',false,'error','Check at least one entity you want to be involved with.'); end if;
  select * into v_ent from team_onboarding_entities where slug = p->>'entity_slug' and active;
  if not found then return jsonb_build_object('ok',false,'error','Choose your main entity.'); end if;
  if not (v_ent.slug = any(v_involved)) then v_involved := array_append(v_involved, v_ent.slug); end if;
  select coalesce(array_agg(left(trim(x), 60)), '{}') into v_interests
    from (select x from jsonb_array_elements_text(case when jsonb_typeof(p->'interests') = 'array' then p->'interests' else '[]'::jsonb end) x limit 20) t
    where length(trim(x)) > 0;
  if length(trim(coalesce(p->>'residence_city',''))) < 2 or length(trim(coalesce(p->>'residence_state',''))) < 2 then
    return jsonb_build_object('ok',false,'error','Enter the city and state where you live.');
  end if;
  if length(trim(coalesce(p->>'role_title',''))) < 2 then return jsonb_build_object('ok',false,'error','Enter your role.'); end if;
  if length(trim(coalesce(p->>'mailing_address',''))) < 8 then return jsonb_build_object('ok',false,'error','Enter your mailing address.'); end if;
  if length(trim(coalesce(p->>'emergency_contact_name',''))) < 2 or length(regexp_replace(coalesce(p->>'emergency_contact_phone',''),'[^0-9]','','g')) < 10 then
    return jsonb_build_object('ok',false,'error','Enter an emergency contact name and phone.');
  end if;
  if lower(v_typed) <> lower(v_name) then return jsonb_build_object('ok',false,'error','Type your full legal name exactly as entered above to sign.'); end if;
  if coalesce((p->>'electronic_consent')::boolean,false) is not true or coalesce((p->>'read_to_end')::boolean,false) is not true then
    return jsonb_build_object('ok',false,'error','Read the full agreement and agree to sign electronically.');
  end if;
  if coalesce(p->>'signature_png','') !~ '^data:image/png;base64,[A-Za-z0-9+/=]{200,}$' or length(p->>'signature_png') > 400000 then
    return jsonb_build_object('ok',false,'error','Draw your signature in the box.');
  end if;
  if length(trim(coalesce(p->>'initials',''))) not between 1 and 5 then return jsonb_build_object('ok',false,'error','Enter your initials.'); end if;
  if v_local_part !~ '^[a-z][a-z0-9.]{0,30}$' then return jsonb_build_object('ok',false,'error','Work email name can use letters, numbers and dots only.'); end if;
  if not exists (select 1 from pg_timezone_names where name = v_tz) then v_tz := 'America/New_York'; end if;
  if coalesce(p->>'nda_rendered_sha256','') !~ '^[0-9a-f]{64}$' then return jsonb_build_object('ok',false,'error','Signing failed. Reload and try again.'); end if;

  v_signed_local := (now() at time zone v_tz)::date;
  v_address := case when v_ent.work_email_domain is not null then v_local_part || '@' || v_ent.work_email_domain end;
  v_request_status := case when v_ent.work_email_domain is null then 'domain_not_ready' else 'awaiting_founder_approval' end;

  select id into v_member_id from team_members
   where lower(coalesce(personal_email,'')) = v_email or lower(coalesce(email,'')) = v_email
   order by (status='active') desc, created_at limit 1;

  if v_member_id is null then
    insert into team_members(full_name, preferred_name, email, personal_email, phone, role_title, role_type, primary_brand, entity_slug,
      brands_assigned, start_date, status, mailing_address, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
      preferred_contact_method, best_time_to_reach, shirt_size, hoodie_size, pants_size, shoe_size, residence_city, residence_state,
      involved_entities, interests, interests_notes, requested_work_email, onboarding_source, onboarding_submitted_at,
      nda_signed, nda_signed_at, onboarding_complete, onboarding_completed_at)
    values (v_name, nullif(trim(p->>'preferred_name'),''), v_email, v_email, v_phone, trim(p->>'role_title'), 'team', v_ent.slug, v_ent.slug,
      v_involved, nullif(p->>'start_date','')::date, 'pending', trim(p->>'mailing_address'), trim(p->>'emergency_contact_name'),
      nullif(trim(p->>'emergency_contact_relationship'),''), p->>'emergency_contact_phone', nullif(p->>'preferred_contact_method',''),
      nullif(trim(p->>'best_time_to_reach'),''), nullif(p->>'shirt_size',''), nullif(p->>'hoodie_size',''), nullif(left(trim(p->>'pants_size'),20),''),
      nullif(left(trim(p->>'shoe_size'),20),''), trim(p->>'residence_city'), trim(p->>'residence_state'),
      v_involved, v_interests, nullif(left(trim(p->>'interests_notes'),600),''), v_address, 'onboarding_link', now(),
      true, now(), true, now())
    returning id into v_member_id;
  else
    v_existing := true;
    -- Existing record: only fill fields that are empty, so nobody can overwrite a teammate's details by typing their email.
    update team_members set
      preferred_name = coalesce(preferred_name, nullif(trim(p->>'preferred_name'),'')),
      personal_email = coalesce(personal_email, v_email),
      phone = coalesce(phone, v_phone),
      entity_slug = coalesce(entity_slug, v_ent.slug),
      primary_brand = coalesce(primary_brand, v_ent.slug),
      brands_assigned = (select array_agg(distinct b) from unnest(coalesce(brands_assigned,'{}') || v_involved) b),
      involved_entities = (select array_agg(distinct b) from unnest(coalesce(involved_entities,'{}') || v_involved) b),
      interests = case when cardinality(coalesce(interests,'{}')) = 0 then v_interests else interests end,
      interests_notes = coalesce(interests_notes, nullif(left(trim(p->>'interests_notes'),600),'')),
      hoodie_size = coalesce(hoodie_size, nullif(p->>'hoodie_size','')),
      pants_size = coalesce(pants_size, nullif(left(trim(p->>'pants_size'),20),'')),
      shoe_size = coalesce(shoe_size, nullif(left(trim(p->>'shoe_size'),20),'')),
      residence_city = coalesce(residence_city, trim(p->>'residence_city')),
      residence_state = coalesce(residence_state, trim(p->>'residence_state')),
      start_date = coalesce(start_date, nullif(p->>'start_date','')::date),
      mailing_address = coalesce(mailing_address, trim(p->>'mailing_address')),
      emergency_contact_name = coalesce(emergency_contact_name, trim(p->>'emergency_contact_name')),
      emergency_contact_relationship = coalesce(emergency_contact_relationship, nullif(trim(p->>'emergency_contact_relationship'),'')),
      emergency_contact_phone = coalesce(emergency_contact_phone, p->>'emergency_contact_phone'),
      preferred_contact_method = coalesce(preferred_contact_method, nullif(p->>'preferred_contact_method','')),
      best_time_to_reach = coalesce(best_time_to_reach, nullif(trim(p->>'best_time_to_reach'),'')),
      shirt_size = coalesce(shirt_size, nullif(p->>'shirt_size','')),
      requested_work_email = coalesce(requested_work_email, v_address),
      onboarding_source = coalesce(onboarding_source, 'onboarding_link'),
      onboarding_submitted_at = now(),
      nda_signed = true, nda_signed_at = now(),
      onboarding_complete = true, onboarding_completed_at = coalesce(onboarding_completed_at, now())
    where id = v_member_id;
  end if;

  v_token := encode(gen_random_bytes(16), 'hex');
  insert into team_ndas(member_id, signer_name, signer_email, signer_address, signer_role, brand_scope, effective_date, duration_years,
    signature_method, signature_payload, signature_ip, signature_user_agent, signed_at, status, verification_token, source,
    nda_version_key, nda_template_sha256, nda_rendered_sha256, nda_rendered_text, signer_phone, signer_entity, signer_initials,
    typed_signature_name, signed_date_local, signer_timezone, electronic_consent, read_to_end)
  values (v_member_id, v_name, v_email, trim(p->>'mailing_address'), trim(p->>'role_title'), array[v_ent.slug], v_signed_local, 2,
    'drawn_and_typed', p->>'signature_png', nullif(p->>'ip',''), left(coalesce(p->>'user_agent',''), 500), now(), 'signed', v_token,
    case when v_ver.status = 'approved' then 'onboarding_link' else 'onboarding_link_preview' end,
    v_ver.version_key, v_ver.body_sha256, p->>'nda_rendered_sha256', p->>'nda_rendered_text', v_phone, v_ent.display_name, upper(trim(p->>'initials')),
    v_typed, v_signed_local, v_tz, true, true)
  returning id into v_nda_id;

  insert into team_work_email_requests(member_id, entity_slug, requested_local_part, domain, requested_address, status)
  values (v_member_id, v_ent.slug, v_local_part, v_ent.work_email_domain, v_address, v_request_status);

  insert into team_onboarding_steps(member_id, step_key, step_label, step_order, status, payload, completed_at) values
    (v_member_id, 'info', 'Personal and contact info submitted', 1, 'done', jsonb_build_object('source','onboarding_link'), now()),
    (v_member_id, 'nda', 'NDA signed and dated', 2, 'done', jsonb_build_object('nda_id', v_nda_id, 'version', v_ver.version_key, 'signed_date', v_signed_local), now()),
    (v_member_id, 'work_email', 'Work email ' || coalesce(v_address, '(domain not ready)') || ' waits for founder approval', 3, 'pending', jsonb_build_object('address', v_address), null),
    (v_member_id, 'access', 'Dashboard access waits for founder approval', 4, 'pending', null, null),
    (v_member_id, 'nda_countersign', 'Company countersignature on NDA', 5, 'pending', jsonb_build_object('nda_id', v_nda_id), null);

  insert into team_portal_submissions(submission_type, brand_key, payload, resulted_in_id, ip, user_agent)
  values ('onboarding', v_ent.slug,
    (p - 'signature_png' - 'nda_rendered_text' - 'preview_ok') || jsonb_build_object('member_existing', v_existing, 'nda_id', v_nda_id),
    v_member_id, nullif(p->>'ip',''), left(coalesce(p->>'user_agent',''),500));

  return jsonb_build_object('ok', true, 'member_id', v_member_id, 'member_existing', v_existing, 'nda_id', v_nda_id,
    'verification_token', v_token, 'signed_date', v_signed_local, 'work_email', v_address, 'work_email_status', v_request_status,
    'entity', v_ent.display_name);
end;
$fn$;

revoke all on function public.submit_team_onboarding(jsonb) from public, anon, authenticated;
grant execute on function public.submit_team_onboarding(jsonb) to service_role;

create or replace view public.v_team_onboarding_board with (security_invoker = true) as
select m.id member_id, m.full_name, m.preferred_name, m.entity_slug, e.display_name entity, m.role_title, m.status member_status,
  m.phone, m.personal_email, m.residence_city, m.residence_state, m.involved_entities, m.interests,
  m.shirt_size, m.hoodie_size, m.pants_size, m.shoe_size, m.onboarding_submitted_at, n.id nda_id, n.signed_at, n.signed_date_local, n.nda_version_key,
  n.pdf_storage_path, n.company_countersigned_at, w.requested_address work_email, w.status work_email_status
from team_members m
left join team_onboarding_entities e on e.slug = m.entity_slug
left join lateral (select * from team_ndas x where x.member_id = m.id and x.status='signed' order by signed_at desc limit 1) n on true
left join lateral (select * from team_work_email_requests r where r.member_id = m.id order by created_at desc limit 1) w on true
where m.onboarding_source = 'onboarding_link';
revoke all on public.v_team_onboarding_board from anon, authenticated;
