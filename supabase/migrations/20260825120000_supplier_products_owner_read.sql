-- Additive: lets a supplier org's own members read ALL of their
-- supplier_products rows (including unavailable ones) for the supplier
-- dashboard, alongside the existing public "is_available = true" policy.
-- Permissive SELECT policies are OR'd together in Postgres RLS, so this
-- cannot weaken or replace the existing public-read policy, and it never
-- exposes another org's unavailable rows (scoped by is_member_of_org).
create policy supplier_products_owner_read
on public.supplier_products
for select
to authenticated
using (public.is_member_of_org(supplier_organization_id));