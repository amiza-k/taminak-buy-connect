import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { MarketScope } from "@/hooks/use-location";

export type SupplierOrg = {
  id: string;
  name: string;
  province: string | null;
  city: string | null;
  address: string | null;
  supplier_status: string | null;
};

export type Offer = {
  id: string;
  unit_price: number;
  is_available: boolean;
  sku: string | null;
  supplier_organization_id: string;
  organizations: SupplierOrg | null;
};

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  brand: string | null;
  unit: string | null;
  image_url: string | null;
};

export type ProductWithOffers = ProductRow & { supplier_products: Offer[] };

export type LocationFilter = {
  province: string | null;
  city: string | null;
  scope: MarketScope;
};

export function matchesLocation(
  org: { province: string | null; city: string | null } | null | undefined,
  filter: LocationFilter,
): boolean {
  if (!org) return false;
  if (filter.scope === "country") return true;
  if (filter.scope === "province") return !filter.province || org.province === filter.province;
  if (!filter.city) return !filter.province || org.province === filter.province;
  return org.city === filter.city;
}

export function averageRating(ratings: number[]): { average: number | null; count: number } {
  if (ratings.length === 0) return { average: null, count: 0 };
  const sum = ratings.reduce((acc, value) => acc + value, 0);
  return { average: sum / ratings.length, count: ratings.length };
}

const ORG_FIELDS = "id, name, province, city, address, supplier_status";
const PRODUCT_FIELDS = "id, name, slug, description, category, brand, unit, image_url";

export async function fetchProducts(search: string): Promise<ProductWithOffers[]> {
  let query = supabase
    .from("products")
    .select(
      `${PRODUCT_FIELDS}, supplier_products ( id, unit_price, is_available, sku, supplier_organization_id, organizations ( ${ORG_FIELDS} ) )`,
    )
    .eq("is_active", true)
    .order("name");

  const term = search.trim();
  if (term) {
    const escaped = term.replace(/[%,()]/g, " ");
    query = query.or(
      `name.ilike.%${escaped}%,description.ilike.%${escaped}%,brand.ilike.%${escaped}%,category.ilike.%${escaped}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as ProductWithOffers[];
}

export async function fetchProduct(productId: string): Promise<ProductWithOffers | null> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `${PRODUCT_FIELDS}, supplier_products ( id, unit_price, is_available, sku, supplier_organization_id, organizations ( ${ORG_FIELDS} ) )`,
    )
    .eq("id", productId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as ProductWithOffers | null;
}

export type SupplierSummary = SupplierOrg & {
  offerCount: number;
  rating: number | null;
  reviewCount: number;
};

export async function fetchSuppliers(): Promise<SupplierSummary[]> {
  const { data, error } = await supabase
    .from("organizations")
    .select(`${ORG_FIELDS}, supplier_products ( id, is_available ), reviews ( rating )`)
    .eq("type", "supplier")
    .order("name");
  if (error) throw error;

  return (data ?? []).map((row) => {
    const org = row as unknown as SupplierOrg & {
      supplier_products: { id: string; is_available: boolean }[] | null;
      reviews: { rating: number }[] | null;
    };
    const { average, count } = averageRating((org.reviews ?? []).map((r) => r.rating));
    return {
      id: org.id,
      name: org.name,
      province: org.province,
      city: org.city,
      address: org.address,
      supplier_status: org.supplier_status,
      offerCount: (org.supplier_products ?? []).filter((o) => o.is_available).length,
      rating: average,
      reviewCount: count,
    };
  });
}

export type SupplierDetail = SupplierOrg & {
  rating: number | null;
  reviewCount: number;
  reviews: { id: string; rating: number; comment: string | null; created_at: string }[];
  offers: (Omit<Offer, "organizations"> & { products: ProductRow | null })[];
};

export async function fetchSupplier(supplierId: string): Promise<SupplierDetail | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select(
      `${ORG_FIELDS}, supplier_products ( id, unit_price, is_available, sku, supplier_organization_id, products ( ${PRODUCT_FIELDS} ) ), reviews ( id, rating, comment, created_at )`,
    )
    .eq("id", supplierId)
    .eq("type", "supplier")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const org = data as unknown as SupplierOrg & {
    supplier_products: SupplierDetail["offers"] | null;
    reviews: SupplierDetail["reviews"] | null;
  };
  const reviews = (org.reviews ?? []).slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
  const { average, count } = averageRating(reviews.map((r) => r.rating));

  return {
    id: org.id,
    name: org.name,
    province: org.province,
    city: org.city,
    address: org.address,
    supplier_status: org.supplier_status,
    rating: average,
    reviewCount: count,
    reviews,
    offers: org.supplier_products ?? [],
  };
}

export async function fetchSupplierRatings(
  supplierIds: string[],
): Promise<Record<string, { rating: number | null; reviewCount: number }>> {
  if (supplierIds.length === 0) return {};
  const { data, error } = await supabase
    .from("reviews")
    .select("supplier_organization_id, rating")
    .in("supplier_organization_id", supplierIds);
  if (error) throw error;

  const grouped: Record<string, number[]> = {};
  for (const row of data ?? []) {
    (grouped[row.supplier_organization_id] ??= []).push(row.rating);
  }
  const result: Record<string, { rating: number | null; reviewCount: number }> = {};
  for (const id of supplierIds) {
    const { average, count } = averageRating(grouped[id] ?? []);
    result[id] = { rating: average, reviewCount: count };
  }
  return result;
}

export const productsQuery = (search: string) =>
  queryOptions({ queryKey: ["products", search], queryFn: () => fetchProducts(search) });

export const productQuery = (productId: string) =>
  queryOptions({ queryKey: ["product", productId], queryFn: () => fetchProduct(productId) });

export const suppliersQuery = () =>
  queryOptions({ queryKey: ["suppliers"], queryFn: fetchSuppliers });

export const supplierQuery = (supplierId: string) =>
  queryOptions({ queryKey: ["supplier", supplierId], queryFn: () => fetchSupplier(supplierId) });

export const supplierRatingsQuery = (supplierIds: string[]) =>
  queryOptions({
    queryKey: ["supplier-ratings", [...supplierIds].sort()],
    queryFn: () => fetchSupplierRatings(supplierIds),
  });

export function lowestAvailablePrice(offers: Offer[]): number | null {
  const prices = offers.filter((o) => o.is_available).map((o) => Number(o.unit_price));
  return prices.length ? Math.min(...prices) : null;
}
