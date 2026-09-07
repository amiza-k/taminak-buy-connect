-- A restaurant location is the source of truth for checkout contact and delivery details.
alter table public.organizations
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists phone_verified boolean not null default false,
  add column if not exists email_verified boolean not null default false;

alter table public.organizations
  drop constraint if exists organizations_coordinates_check;
alter table public.organizations
  add constraint organizations_coordinates_check check (
    (latitude is null and longitude is null)
    or (latitude between -90 and 90 and longitude between -180 and 180)
  );

create table if not exists public.organization_verification_codes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel text not null check (channel in ('phone', 'email')),
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.organization_verification_codes enable row level security;
-- Codes are exclusively handled by the Edge Function using the service-role key.

-- An owner may request a verification only for a contact that belongs to their organization.
create or replace function public.store_organization_verification_code(
  p_organization_id uuid,
  p_channel text,
  p_code_hash text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.has_role_in_org(p_organization_id, 'owner') then
    raise exception 'Not authorized';
  end if;
  if p_channel not in ('phone', 'email') then raise exception 'Invalid verification channel'; end if;
  if not exists (
    select 1 from public.organizations
    where id = p_organization_id
      and ((p_channel = 'phone' and nullif(btrim(phone), '') is not null)
        or (p_channel = 'email' and nullif(btrim(email), '') is not null))
  ) then raise exception 'Contact is required'; end if;
  update public.organization_verification_codes
  set consumed_at = now()
  where organization_id = p_organization_id and channel = p_channel and consumed_at is null;
  insert into public.organization_verification_codes (organization_id, channel, code_hash, expires_at)
  values (p_organization_id, p_channel, p_code_hash, now() + interval '10 minutes');
end;
$$;

create or replace function public.confirm_organization_verification(
  p_organization_id uuid,
  p_channel text,
  p_code_hash text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_code_id uuid;
begin
  if auth.uid() is null or not public.has_role_in_org(p_organization_id, 'owner') then
    raise exception 'Not authorized';
  end if;
  select id into v_code_id from public.organization_verification_codes
  where organization_id = p_organization_id and channel = p_channel and code_hash = p_code_hash
    and consumed_at is null and expires_at > now()
  order by created_at desc limit 1 for update;
  if v_code_id is null then raise exception 'Invalid or expired code'; end if;
  update public.organization_verification_codes set consumed_at = now() where id = v_code_id;
  if p_channel = 'phone' then
    update public.organizations set phone_verified = true where id = p_organization_id;
  elsif p_channel = 'email' then
    update public.organizations set email_verified = true where id = p_organization_id;
  else raise exception 'Invalid verification channel'; end if;
end;
$$;

grant execute on function public.store_organization_verification_code(uuid, text, text) to authenticated;
grant execute on function public.confirm_organization_verification(uuid, text, text) to authenticated;

-- A checkout may only use a fully verified restaurant location, and snapshots its saved details.
-- Keep the existing transaction implementation private and wrap it with the location guard.
alter function public.checkout_cart(uuid, text, text, text) rename to checkout_cart_legacy;
revoke all on function public.checkout_cart_legacy(uuid, text, text, text) from public;

create function public.checkout_cart(
  p_cart_id uuid,
  p_delivery_address text default null,
  p_contact_phone text default null,
  p_note text default null
)
returns table (order_id uuid, supplier_organization_id uuid, total numeric)
language plpgsql security definer set search_path to public
as $function$
declare v_org record;
begin
  select o.* into v_org from public.carts c join public.organizations o on o.id = c.organization_id
  where c.id = p_cart_id;
  if v_org is null or not v_org.phone_verified or not v_org.email_verified
     or nullif(btrim(v_org.address), '') is null or nullif(btrim(v_org.phone), '') is null then
    raise exception 'Organization contact and address must be verified before checkout';
  end if;
  -- Preserve the established implementation while forcing the saved organization data.
  return query select * from public.checkout_cart_legacy(p_cart_id, v_org.address, v_org.phone, p_note);
end;
$function$;

grant execute on function public.checkout_cart(uuid, text, text, text) to authenticated;

-- A changed contact must be verified again before it can be used at checkout.
create or replace function public.reset_organization_contact_verification()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.phone is distinct from old.phone then new.phone_verified := false; end if;
  if new.email is distinct from old.email then new.email_verified := false; end if;
  return new;
end;
$$;

drop trigger if exists organizations_reset_contact_verification on public.organizations;
create trigger organizations_reset_contact_verification
before update on public.organizations
for each row execute function public.reset_organization_contact_verification();