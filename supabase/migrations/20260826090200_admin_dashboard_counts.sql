-- Avoids granting admin broad SELECT on orders; function re-checks
-- is_platform_admin() before returning anything.
create or replace function public.admin_dashboard_counts()
returns table (
  pending_supplier_applications bigint,
  pending_product_submissions bigint,
  approved_suppliers bigint,
  active_products bigint,
  recent_orders_count bigint
)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.is_platform_admin() then
    raise exception 'Not authorized';
  end if;

  return query
  select
    (select count(*) from public.supplier_applications where status = 'pending'),
    (select count(*) from public.product_submissions where status = 'pending'),
    (select count(*) from public.organizations where type = 'supplier' and supplier_status = 'approved'),
    (select count(*) from public.products where is_active = true),
    (select count(*) from public.orders where created_at > now() - interval '30 days');
end;
$function$;

revoke all on function public.admin_dashboard_counts() from public;
grant execute on function public.admin_dashboard_counts() to authenticated;