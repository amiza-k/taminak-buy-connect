-- Additive UPDATE policy: a supplier_admin can update their own supplier
-- organization's row (name/phone/email/address/province/city). Restricted
-- to type = 'supplier' rows they hold supplier_admin in — cannot touch any
-- other organization.
create policy organizations_supplier_admin_update
on public.organizations
for update
to authenticated
using (
  type = 'supplier'
  and public.has_role_in_org(id, 'supplier_admin')
)
with check (
  type = 'supplier'
  and public.has_role_in_org(id, 'supplier_admin')
);

-- Defense in depth: block changes to the protected columns (type,
-- supplier_status) from anyone other than owner/manager/platform admin,
-- regardless of which UPDATE policy let the row through. This stops a
-- supplier_admin from using the policy above to self-approve or change
-- their org's type, without having to enumerate every editable column in
-- the RLS policy itself.
create or replace function public.prevent_supplier_org_protected_field_changes()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.type is distinct from old.type
     or new.supplier_status is distinct from old.supplier_status
  then
    if not (
      public.has_role_in_org(old.id, 'owner')
      or public.has_role_in_org(old.id, 'manager')
      or public.is_platform_admin()
    ) then
      raise exception 'Not authorized to change organization type or supplier status';
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists organizations_protect_fields on public.organizations;
create trigger organizations_protect_fields
before update on public.organizations
for each row
execute function public.prevent_supplier_org_protected_field_changes();