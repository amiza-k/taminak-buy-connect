-- Additive: platform admins can create/update/delete canonical products.
-- Public read policy (products_public_read) is untouched.
create policy products_admin_write
on public.products
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());