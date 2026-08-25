import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

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