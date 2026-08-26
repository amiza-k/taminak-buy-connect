-- 1. Per-offer description (supplier's own copy, distinct from the
--    canonical product's description). Additive, nullable.
alter table public.supplier_products add column description text;

-- 2. Per-offer media (images/videos), independently owned per supplier --
--    Supplier A's media must never be visible as Supplier B's media, which
--    is naturally satisfied since each row is scoped to one supplier_product.
create table public.supplier_offer_media (
  id uuid primary key default gen_random_uuid(),
  supplier_product_id uuid not null references public.supplier_products(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid
);

create index supplier_offer_media_supplier_product_id_idx
  on public.supplier_offer_media (supplier_product_id);

alter table public.supplier_offer_media enable row level security;

-- Public read: media rides along with the public offer listing.
create policy supplier_offer_media_public_read
on public.supplier_offer_media
for select
to anon, authenticated
using (true);

-- Only the owning supplier org (supplier_admin/owner) may manage its own
-- offer's media -- mirrors supplier_products_owner_* policies exactly.
create policy supplier_offer_media_owner_write
on public.supplier_offer_media
for all
to authenticated
using (
  exists (
    select 1 from public.supplier_products sp
    where sp.id = supplier_offer_media.supplier_product_id
      and (
        public.has_role_in_org(sp.supplier_organization_id, 'supplier_admin')
        or public.has_role_in_org(sp.supplier_organization_id, 'owner')
      )
  )
)
with check (
  exists (
    select 1 from public.supplier_products sp
    where sp.id = supplier_offer_media.supplier_product_id
      and (
        public.has_role_in_org(sp.supplier_organization_id, 'supplier_admin')
        or public.has_role_in_org(sp.supplier_organization_id, 'owner')
      )
  )
);

-- 3. Storage bucket for the actual files. Public bucket (read), since offer
--    media is meant to be publicly viewable on the marketplace, same as
--    product image_url today.
insert into storage.buckets (id, name, public)
values ('supplier-offer-media', 'supplier-offer-media', true)
on conflict (id) do nothing;

-- Path convention enforced by policy: {supplier_organization_id}/{supplier_product_id}/{filename}
-- Anyone can read (bucket is public), but only a member with supplier_admin/owner
-- role in the org named by the first path segment may write/delete -- this
-- scopes uploads without needing a join to supplier_products at the storage layer.
create policy supplier_offer_media_storage_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'supplier-offer-media');

create policy supplier_offer_media_storage_write
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'supplier-offer-media'
  and (
    public.has_role_in_org(((storage.foldername(name))[1])::uuid, 'supplier_admin')
    or public.has_role_in_org(((storage.foldername(name))[1])::uuid, 'owner')
  )
);

create policy supplier_offer_media_storage_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'supplier-offer-media'
  and (
    public.has_role_in_org(((storage.foldername(name))[1])::uuid, 'supplier_admin')
    or public.has_role_in_org(((storage.foldername(name))[1])::uuid, 'owner')
  )
);
