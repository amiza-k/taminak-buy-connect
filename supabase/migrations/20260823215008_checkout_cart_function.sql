-- Atomic multi-supplier checkout.
-- Groups the active cart's items by supplier, creates one order per supplier
-- plus its order_items, snapshots product name/price, and marks the cart
-- converted -- all inside a single transaction so a partial failure cannot
-- leave incomplete orders behind.
create or replace function public.checkout_cart(
  p_cart_id uuid,
  p_delivery_address text,
  p_contact_phone text,
  p_note text default null
)
returns table (order_id uuid, supplier_organization_id uuid, total numeric)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid;
  v_cart record;
  v_item_count int;
  v_unavailable_count int;
  v_supplier record;
  v_order_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  -- Lock the cart row first so two concurrent checkout attempts on the same
  -- cart serialize: the second one will see status <> 'active' and abort.
  select * into v_cart
  from public.carts
  where id = p_cart_id
  for update;

  if v_cart is null then
    raise exception 'Cart not found';
  end if;

  if not public.is_member_of_org(v_cart.organization_id) then
    raise exception 'Not authorized for this cart';
  end if;

  if v_cart.status <> 'active' then
    raise exception 'Cart is not active';
  end if;

  if p_delivery_address is null or btrim(p_delivery_address) = '' then
    raise exception 'Delivery address is required';
  end if;

  if p_contact_phone is null or btrim(p_contact_phone) = '' then
    raise exception 'Contact phone is required';
  end if;

  select count(*) into v_item_count
  from public.cart_items
  where cart_id = p_cart_id;

  if v_item_count = 0 then
    raise exception 'Cart is empty';
  end if;

  -- Lock the referenced supplier_products so price/availability cannot
  -- change between this check and the inserts below.
  perform 1
  from public.cart_items ci
  join public.supplier_products sp on sp.id = ci.supplier_product_id
  where ci.cart_id = p_cart_id
  for update of sp;

  select count(*) into v_unavailable_count
  from public.cart_items ci
  join public.supplier_products sp on sp.id = ci.supplier_product_id
  where ci.cart_id = p_cart_id
    and sp.is_available = false;

  if v_unavailable_count > 0 then
    raise exception 'One or more cart items are no longer available';
  end if;

  for v_supplier in
    select sp.supplier_organization_id as org_id,
           sum(ci.quantity * sp.unit_price) as supplier_subtotal
    from public.cart_items ci
    join public.supplier_products sp on sp.id = ci.supplier_product_id
    where ci.cart_id = p_cart_id
    group by sp.supplier_organization_id
  loop
    insert into public.orders (
      buyer_organization_id,
      supplier_organization_id,
      created_by,
      status,
      subtotal,
      total,
      delivery_address,
      contact_phone,
      note
    ) values (
      v_cart.organization_id,
      v_supplier.org_id,
      v_user_id,
      'pending',
      v_supplier.supplier_subtotal,
      v_supplier.supplier_subtotal,
      btrim(p_delivery_address),
      btrim(p_contact_phone),
      nullif(btrim(p_note), '')
    )
    returning id into v_order_id;

    insert into public.order_items (
      order_id,
      product_id,
      supplier_product_id,
      product_name,
      quantity,
      unit_price,
      subtotal
    )
    select
      v_order_id,
      sp.product_id,
      sp.id,
      p.name,
      ci.quantity,
      sp.unit_price,
      ci.quantity * sp.unit_price
    from public.cart_items ci
    join public.supplier_products sp on sp.id = ci.supplier_product_id
    join public.products p on p.id = sp.product_id
    where ci.cart_id = p_cart_id
      and sp.supplier_organization_id = v_supplier.org_id;

    order_id := v_order_id;
    supplier_organization_id := v_supplier.org_id;
    total := v_supplier.supplier_subtotal;
    return next;
  end loop;

  update public.carts
  set status = 'converted'
  where id = p_cart_id;

  return;
end;
$function$;

revoke all on function public.checkout_cart(uuid, text, text, text) from public;
grant execute on function public.checkout_cart(uuid, text, text, text) to authenticated;