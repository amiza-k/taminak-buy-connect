-- Controlled category taxonomy, replacing free-text products.category as the
-- source of truth. products.category is kept (not dropped) for backward
-- compatibility with any existing reads; category_id is the new canonical
-- reference going forward.
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.categories(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;

-- Public can read active categories only (mirrors organizations/products public-read pattern).
create policy categories_public_read
on public.categories
for select
to anon, authenticated
using (is_active = true);

-- Platform admins manage the full taxonomy.
create policy categories_admin_write
on public.categories
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- Seed from the exact distinct values audited in products.category today
-- (3 clean, unambiguous values -- no near-duplicates found).
insert into public.categories (name, slug) values
  ('لبنیات', 'labaniyat'),
  ('قهوه و نوشیدنی', 'ghahve-va-nooshidani'),
  ('بسته‌بندی', 'bastebandi');

-- Add the new FK column to products (nullable, additive) and backfill from
-- the existing free-text category using the seed above.
alter table public.products add column category_id uuid references public.categories(id);

update public.products p
set category_id = c.id
from public.categories c
where p.category = c.name;

-- Add the matching FK column to product_submissions so suppliers pick from
-- the controlled list too. proposed_category (text) is kept for backward
-- compatibility / display of older submissions.
alter table public.product_submissions add column proposed_category_id uuid references public.categories(id);
