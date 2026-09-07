-- Organization email verification is temporarily disabled. Keep the existing
-- email_verified column and verification functions intact so the requirement can
-- be restored by a future migration without a schema rollback.
create or replace function public.checkout_cart(
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
  if v_org is null or not v_org.phone_verified
     or nullif(btrim(v_org.address), '') is null or nullif(btrim(v_org.phone), '') is null then
    raise exception 'Organization phone and address must be verified before checkout';
  end if;
  -- Preserve the saved organization details while email verification is disabled.
  return query select * from public.checkout_cart_legacy(p_cart_id, v_org.address, v_org.phone, p_note);
end;
$function$;