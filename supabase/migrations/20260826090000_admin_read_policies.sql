-- Admin-only SELECT access so the admin panel can list applications/submissions
-- via normal client queries. Approve/reject writes go through security-definer
-- RPCs below, so this policy only affects reads.
create policy supplier_applications_admin_read
on public.supplier_applications
for select
to authenticated
using (public.is_platform_admin());

create policy product_submissions_admin_read
on public.product_submissions
for select
to authenticated
using (public.is_platform_admin());