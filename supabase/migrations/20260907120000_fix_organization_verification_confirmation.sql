-- Allow the protected verification flags to be set only by the confirmation RPC.
-- A transaction-local flag lets the trigger distinguish that RPC's internal
-- update from a direct client update, while still allowing contact changes to
-- invalidate an existing verification flag.
create or replace function public.protect_organization_verification_flags()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if (
    (new.phone_verified is true and old.phone_verified is not true)
    or (new.email_verified is true and old.email_verified is not true)
  ) and current_setting('app.organization_verification_confirmation', true) is distinct from 'true' then
    raise exception 'phone_verified/email_verified can only be changed via confirm_organization_verification()';
  end if;

  return new;
end;
$function$;

create or replace function public.confirm_organization_verification(
  p_organization_id uuid,
  p_channel text,
  p_code_hash text
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_code_id uuid;
begin
  if auth.uid() is null or not public.has_role_in_org(p_organization_id, 'owner') then
    raise exception 'Not authorized';
  end if;

  if p_channel not in ('phone', 'email') then
    raise exception 'Invalid verification channel';
  end if;

  select id into v_code_id
  from public.organization_verification_codes
  where organization_id = p_organization_id
    and channel = p_channel
    and code_hash = p_code_hash
    and consumed_at is null
    and expires_at > now()
  order by created_at desc
  limit 1
  for update;

  if v_code_id is null then
    raise exception 'Invalid or expired code';
  end if;

  -- The trigger reads this local setting to permit only this RPC to set a
  -- verification flag to true. It is cleared automatically at transaction end.
  perform set_config('app.organization_verification_confirmation', 'true', true);

  if p_channel = 'phone' then
    update public.organizations
    set phone_verified = true
    where id = p_organization_id;
  else
    update public.organizations
    set email_verified = true
    where id = p_organization_id;
  end if;

  update public.organization_verification_codes
  set consumed_at = now()
  where id = v_code_id;
end;
$function$;