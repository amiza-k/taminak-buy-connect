import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { TablesUpdate } from "@/integrations/supabase/types";

/* -------------------------------------------------------------- */
/* Platform admin check                                            */
/* -------------------------------------------------------------- */

export function usePlatformAdmin() {
  const { user, loading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ["platform-admin", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc("is_platform_admin");
      if (error) throw error;
      return Boolean(data);
    },
  });

  return {
    isAdmin: query.data ?? false,
    isPending: authLoading || (Boolean(user) && query.isPending),
  };
}

/* -------------------------------------------------------------- */
/* Dashboard                                                       */
/* -------------------------------------------------------------- */

export type AdminDashboardCounts = {
  pending_supplier_applications: number;
  pending_product_submissions: number;
  approved_suppliers: number;
  active_products: number;
  recent_orders_count: number;
};

export const adminDashboardQuery = () =>
  queryOptions({
    queryKey: ["admin-dashboard"],
    queryFn: async (): Promise<AdminDashboardCounts> => {
      const { data, error } = await supabase.rpc("admin_dashboard_counts");
      if (error) throw error;
      const row = data?.[0];
      return {
        pending_supplier_applications: Number(row?.pending_supplier_applications ?? 0),
        pending_product_submissions: Number(row?.pending_product_submissions ?? 0),
        approved_suppliers: Number(row?.approved_suppliers ?? 0),
        active_products: Number(row?.active_products ?? 0),
        recent_orders_count: Number(row?.recent_orders_count ?? 0),
      };
    },
  });

/* -------------------------------------------------------------- */
/* Supplier applications                                           */
/* -------------------------------------------------------------- */

export type AdminSupplierApplication = {
  id: string;
  business_name: string;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  province: string;
  city: string;
  address: string | null;
  description: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
};

export type ApplicationStatusFilter = "pending" | "approved" | "rejected";

export const supplierApplicationsAdminQuery = (status: ApplicationStatusFilter) =>
  queryOptions({
    queryKey: ["admin-supplier-applications", status],
    queryFn: async (): Promise<AdminSupplierApplication[]> => {
      const { data, error } = await supabase
        .from("supplier_applications")
        .select(
          "id, business_name, owner_name, phone, email, province, city, address, description, status, rejection_reason, created_at",
        )
        .eq("status", status)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdminSupplierApplication[];
    },
  });

export const supplierApplicationAdminQuery = (applicationId: string) =>
  queryOptions({
    queryKey: ["admin-supplier-application", applicationId],
    queryFn: async (): Promise<AdminSupplierApplication | null> => {
      const { data, error } = await supabase
        .from("supplier_applications")
        .select(
          "id, business_name, owner_name, phone, email, province, city, address, description, status, rejection_reason, created_at",
        )
        .eq("id", applicationId)
        .maybeSingle();
      if (error) throw error;
      return data as AdminSupplierApplication | null;
    },
  });

function invalidateSupplierApplications(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["admin-supplier-applications"] });
  queryClient.invalidateQueries({ queryKey: ["admin-supplier-application"] });
  queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
}

export function useApproveSupplierApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase.rpc("approve_supplier_application", {
        p_application_id: applicationId,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateSupplierApplications(queryClient),
  });
}

export function useRejectSupplierApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ applicationId, reason }: { applicationId: string; reason: string }) => {
      const { error } = await supabase.rpc("reject_supplier_application", {
        p_application_id: applicationId,
        p_reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateSupplierApplications(queryClient),
  });
}

/* -------------------------------------------------------------- */
/* Product submissions                                             */
/* -------------------------------------------------------------- */

export type AdminProductSubmission = {
  id: string;
  proposed_name: string;
  proposed_description: string | null;
  proposed_category: string | null;
  proposed_brand: string | null;
  proposed_unit: string | null;
  proposed_price: number | null;
  proposed_sku: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  supplier_organization_id: string;
  supplierName: string;
};

export const productSubmissionsAdminQuery = (status: ApplicationStatusFilter) =>
  queryOptions({
    queryKey: ["admin-product-submissions", status],
    queryFn: async (): Promise<AdminProductSubmission[]> => {
      const { data, error } = await supabase
        .from("product_submissions")
        .select(
          "id, proposed_name, proposed_description, proposed_category, proposed_brand, proposed_unit, proposed_price, proposed_sku, status, rejection_reason, created_at, supplier_organization_id, organizations ( name )",
        )
        .eq("status", status)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => {
        const r = row as unknown as AdminProductSubmission & {
          organizations: { name: string } | null;
        };
        return {
          ...r,
          proposed_price: r.proposed_price === null ? null : Number(r.proposed_price),
          supplierName: r.organizations?.name ?? "تأمین‌کننده",
        };
      });
    },
  });

export const productSubmissionAdminQuery = (submissionId: string) =>
  queryOptions({
    queryKey: ["admin-product-submission", submissionId],
    queryFn: async (): Promise<AdminProductSubmission | null> => {
      const { data, error } = await supabase
        .from("product_submissions")
        .select(
          "id, proposed_name, proposed_description, proposed_category, proposed_brand, proposed_unit, proposed_price, proposed_sku, status, rejection_reason, created_at, supplier_organization_id, organizations ( name )",
        )
        .eq("id", submissionId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const r = data as unknown as AdminProductSubmission & {
        organizations: { name: string } | null;
      };
      return {
        ...r,
        proposed_price: r.proposed_price === null ? null : Number(r.proposed_price),
        supplierName: r.organizations?.name ?? "تأمین‌کننده",
      };
    },
  });

function invalidateProductSubmissions(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["admin-product-submissions"] });
  queryClient.invalidateQueries({ queryKey: ["admin-product-submission"] });
  queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["supplier-submissions"] });
  queryClient.invalidateQueries({ queryKey: ["supplier-offers"] });
}

export function useApproveProductSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (submissionId: string) => {
      const { error } = await supabase.rpc("approve_product_submission", {
        p_submission_id: submissionId,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateProductSubmissions(queryClient),
  });
}

/**
 * Approves a submission by attaching it to an EXISTING canonical product
 * instead of creating a duplicate one — used when the admin recognizes the
 * proposed item already exists in the catalog.
 */
export function useLinkProductSubmissionToExisting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { submissionId: string; existingProductId: string }) => {
      const { error } = await supabase.rpc("approve_product_submission_link_existing", {
        p_submission_id: input.submissionId,
        p_existing_product_id: input.existingProductId,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateProductSubmissions(queryClient),
  });
}

export function useRejectProductSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ submissionId, reason }: { submissionId: string; reason: string }) => {
      const { error } = await supabase.rpc("reject_product_submission", {
        p_submission_id: submissionId,
        p_reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateProductSubmissions(queryClient),
  });
}

/* -------------------------------------------------------------- */
/* Canonical product catalog (admin CRUD)                          */
/* -------------------------------------------------------------- */

function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "product"}-${suffix}`;
}

export type AdminProductListItem = {
  id: string;
  name: string;
  category: string | null;
  is_active: boolean;
  offerCount: number;
};

export type AdminProductFilter = {
  search: string;
  categoryId: string | null;
};

export const adminProductsQuery = (filter: AdminProductFilter) =>
  queryOptions({
    queryKey: ["admin-products", filter.search, filter.categoryId],
    queryFn: async (): Promise<AdminProductListItem[]> => {
      let query = supabase
        .from("products")
        .select("id, name, category, is_active, supplier_products ( id )")
        .order("name");

      const term = filter.search.trim();
      if (term) {
        const escaped = term.replace(/[%,()]/g, " ");
        query = query.ilike("name", `%${escaped}%`);
      }
      if (filter.categoryId) {
        query = query.eq("category_id", filter.categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((row) => {
        const r = row as unknown as AdminProductListItem & {
          supplier_products: { id: string }[] | null;
        };
        return {
          id: r.id,
          name: r.name,
          category: r.category,
          is_active: r.is_active,
          offerCount: (r.supplier_products ?? []).length,
        };
      });
    },
  });

export type AdminProductDetail = {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  brand: string | null;
  unit: string | null;
  image_url: string | null;
  is_active: boolean;
};

export const adminProductQuery = (productId: string) =>
  queryOptions({
    queryKey: ["admin-product", productId],
    queryFn: async (): Promise<AdminProductDetail | null> => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, category_id, brand, unit, image_url, is_active")
        .eq("id", productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const adminProductOfferCountQuery = (productId: string) =>
  queryOptions({
    queryKey: ["admin-product-offer-count", productId],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("supplier_products")
        .select("id", { count: "exact", head: true })
        .eq("product_id", productId);
      if (error) throw error;
      return count ?? 0;
    },
  });

export type AdminProductInput = {
  name: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  brand?: string;
  unit?: string;
  imageUrl?: string;
  isActive: boolean;
};

/** Creates a new canonical product. Category must come from `categories` — never free text. */
export function useCreateAdminProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AdminProductInput) => {
      const { data, error } = await supabase
        .from("products")
        .insert({
          name: input.name.trim(),
          slug: slugify(input.name),
          category_id: input.categoryId,
          category: input.categoryName || null,
          is_active: input.isActive,
          ...(input.description?.trim() ? { description: input.description.trim() } : {}),
          ...(input.brand?.trim() ? { brand: input.brand.trim() } : {}),
          ...(input.unit?.trim() ? { unit: input.unit.trim() } : {}),
          ...(input.imageUrl?.trim() ? { image_url: input.imageUrl.trim() } : {}),
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
}

export type AdminProductUpdateInput = Partial<{
  name: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  brand: string | null;
  unit: string | null;
  imageUrl: string | null;
  isActive: boolean;
}>;

/** Edits an existing canonical product. Never touches supplier_products (offers). */
export function useUpdateAdminProduct(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AdminProductUpdateInput) => {
      const patch: TablesUpdate<"products"> = {};
      if (input.name !== undefined) patch.name = input.name;
      if (input.description !== undefined) patch.description = input.description;
      if (input.categoryId !== undefined) patch.category_id = input.categoryId;
      if (input.categoryName !== undefined) patch.category = input.categoryName;
      if (input.brand !== undefined) patch.brand = input.brand;
      if (input.unit !== undefined) patch.unit = input.unit;
      if (input.imageUrl !== undefined) patch.image_url = input.imageUrl;
      if (input.isActive !== undefined) patch.is_active = input.isActive;

      const { error } = await supabase.from("products").update(patch).eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product", productId] });
    },
  });
}

/**
 * Hard-deletes a canonical product. This will fail with a foreign-key error
 * if any order_items/supplier_products/product_submissions still reference
 * it — in that case, use `useUpdateAdminProduct` with `isActive: false`
 * instead of deleting.
 */
export function useDeleteAdminProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
}
