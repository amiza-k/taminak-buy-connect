-- New, additive function alongside the existing approve_product_submission
-- (left untouched). Lets a platform admin approve a submission by attaching
-- it to an existing canonical product instead of always creating a new one,
-- per the dedup requirement.
create or replace function public.approve_product_submission_link_existing(
  p_submission_id uuid,
  p_existing_product_id uuid
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_submission public.product_submissions;
  v_supplier_product_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'Only platform admins can approve product submissions';
  end if;

  select * into v_submission
  from public.product_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Product submission not found';
  end if;

  if v_submission.status <> 'pending' then
    raise exception 'Product submission is not pending';
  end if;

  if not exists (select 1 from public.products where id = p_existing_product_id) then
    raise exception 'Target product not found';
  end if;

  insert into public.supplier_products (
    supplier_organization_id, product_id, sku, unit_price, is_available
  ) values (
    v_submission.supplier_organization_id,
    p_existing_product_id,
    v_submission.proposed_sku,
    coalesce(v_submission.proposed_price, 0),
    true
  )
  returning id into v_supplier_product_id;

  update public.product_submissions
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      approved_product_id = p_existing_product_id,
      approved_supplier_product_id = v_supplier_product_id,
      updated_at = now()
  where id = p_submission_id;

  return p_existing_product_id;
end;
$function$;
