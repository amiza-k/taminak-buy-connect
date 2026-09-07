-- Let the owner or manager of a non-supplier organization maintain the
-- business location details shown in "My organizations". The check prevents
-- this policy from being used to turn another kind of organization into one.
create policy organizations_business_owner_manager_update
on public.organizations
for update
to authenticated
using (
  type <> 'supplier'
  and (
    public.has_role_in_org(id, 'owner')
    or public.has_role_in_org(id, 'manager')
  )
)
with check (
  type <> 'supplier'
  and (
    public.has_role_in_org(id, 'owner')
    or public.has_role_in_org(id, 'manager')
  )
);