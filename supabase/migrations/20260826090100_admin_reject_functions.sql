create or replace function public.reject_supplier_application(
  p_application_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.is_platform_admin() then
    raise exception 'Not authorized';
  end if;

  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'Rejection reason is required';
  end if;

  update public.supplier_applications
  set status = 'rejected',
      rejection_reason = btrim(p_reason),
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_application_id
    and status = 'pending';

  if not found then
    raise exception 'Application not found or not pending';
  end if;
end;
$function$;

revoke all on function public.reject_supplier_application(uuid, text) from public;
grant execute on function public.reject_supplier_application(uuid, text) to authenticated;

create or replace function public.reject_product_submission(
  p_submission_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.is_platform_admin() then
    raise exception 'Not authorized';
  end if;

  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'Rejection reason is required';
  end if;

  update public.product_submissions
  set status = 'rejected',
      rejection_reason = btrim(p_reason),
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_submission_id
    and status = 'pending';

  if not found then
    raise exception 'Submission not found or not pending';
  end if;
end;
$function$;

revoke all on function public.reject_product_submission(uuid, text) from public;
grant execute on function public.reject_product_submission(uuid, text) to authenticated;