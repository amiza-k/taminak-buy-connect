-- CREATE OR REPLACE FUNCTION cannot change a function's return type.
-- Drop first to guarantee the table-returning signature actually replaces
-- any prior (possibly boolean-returning) definition with the same name.
drop function if exists public.admin_dashboard_counts();

create function public.admin_dashboard_counts()
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