-- Allow a buyer to explicitly choose one of their verified locations at checkout.
-- The selected location is authorized server-side and its saved address/phone are
-- snapshotted by the established checkout implementation.
create function public.checkout_cart(
  p_cart_id uuid,
  p_delivery_organization_id uuid,
  p_note text default null
)
returns table (order_id uuid, supplier_organization_id uuid, total numeric)
language plpgsql security definer set search_path to public
as $function$
declare v_delivery_org record;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select o.* into v_delivery_org
  from public.organizations o
  where o.id = p_delivery_organization_id
    and o.type <> 'supplier'
    and public.is_member_of_org(o.id);

  if v_delivery_org is null or not v_delivery_org.phone_verified
     or nullif(btrim(v_delivery_org.address), '') is null
     or nullif(btrim(v_delivery_org.phone), '') is null then
    raise exception 'Selected delivery location must have a verified phone and address';
  end if;

  return query select * from public.checkout_cart_legacy(
    p_cart_id,
    v_delivery_org.address,
    v_delivery_org.phone,
    p_note
  );
end;
$function$;

grant execute on function public.checkout_cart(uuid, uuid, text) to authenticated;