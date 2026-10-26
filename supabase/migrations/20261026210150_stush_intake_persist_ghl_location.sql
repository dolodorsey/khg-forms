-- Applied in production 2026-10-26 (Supabase migration 20261026210150).
-- Every public intake retains the brand-specific GHL location from the trusted
-- server-side form registry. Do not accept this ID from browser-supplied fields.
create or replace function public.prepare_khg_universal_submission()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  cfg public.khg_form_configs%rowtype;
  current_count integer;
begin
  select * into cfg
  from public.khg_form_configs
  where brand_key = new.brand_key
    and role_type = new.role_type
    and is_active = true
  limit 1;

  if not found then
    raise exception 'FORM_NOT_AVAILABLE';
  end if;

  if cfg.deadline is not null and now() > cfg.deadline then
    raise exception 'FORM_CLOSED';
  end if;

  if cfg.max_submissions is not null then
    select count(*) into current_count
    from public.khg_universal_submissions
    where brand_key = new.brand_key and role_type = new.role_type;
    if current_count >= cfg.max_submissions then
      raise exception 'FORM_CAPACITY_REACHED';
    end if;
  end if;

  new.app_key := coalesce(new.app_key, cfg.app_key);
  new.assigned_to := coalesce(new.assigned_to, cfg.owner);
  -- Explicitly bind the correct CRM subaccount after the form is validated.
  new.ghl_location_id := cfg.ghl_location_id;
  new.next_followup_at := coalesce(
    new.next_followup_at,
    now() + make_interval(mins => greatest(coalesce(cfg.followup_sla_minutes, 60), 0))
  );
  new.followup_status := coalesce(nullif(new.followup_status,''), 'new');
  new.priority := coalesce(nullif(new.priority,''), 'medium');
  return new;
end;
$function$;
