import { useMemo } from "react";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useMyMemberships } from "@/hooks/use-organizations";

export type SupplierApplication = {
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

export type SupplierOffer = {
  id: string;
  sku: string | null;
  unit_price: number;
  is_available: boolean;
  product: { id: string; name: string; unit: string | null; category: string | null } | null;
};

export type SupplierSubmission = {
  id: string;
  proposed_name: string;
  proposed_category: string | null;
  proposed_brand: string | null;
  proposed_unit: string | null;
  proposed_price: number | null;
  proposed_sku: string | null;
  proposed_description: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  approved_product_id: string | null;
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار بررسی",
  approved: "تأیید شده",
  rejected: "رد شده",
};

export const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار بررسی",
  approved: "تأیید شده",
  rejected: "رد شده",
};

/** Supplier organization the user belongs to, plus whether it is approved. */
export function useSupplierMembership() {
  const { data: memberships, isPending } = useMyMemberships();

  return useMemo(() => {
    const membership =
      (memberships ?? []).find((m) => m.organizations?.type === "supplier") ?? null;
    const organization = membership?.organizations ?? null;
    const status = organization?.supplier_status ?? null;
    const isApproved = Boolean(organization) && status !== "rejected" && status !== "pending";
    return {
      isPending,
      membership,
      organization,
      role: membership?.role ?? null,
      /** Only owner/manager may update organization rows under current RLS. */
      canEditOrganization: membership?.role === "owner" || membership?.role === "manager",
      isApproved,
    };
  }, [memberships, isPending]);
}

/* -------------------------------------------------------------- */
/* Supplier application                                            */
/* -------------------------------------------------------------- */

export function useMySupplierApplication() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["supplier-application", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<SupplierApplication | null> => {
      const { data, error } = await supabase
        .from("supplier_applications")
        .select(
          "id, business_name, owner_name, phone, email, province, city, address, description, status, rejection_reason, created_at",
        )
        .eq("applicant_user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as SupplierApplication | null) ?? null;
    },
  });
}

export type SupplierApplicationInput = {
  business_name: string;
  owner_name: string;
  phone: string;
  email: string;
  province: string;
  city: string;
  address: string;
  description: string;
};

export function useSubmitSupplierApplication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: SupplierApplicationInput) => {
      if (!user) throw new Error("ابتدا وارد حساب خود شوید.");
      const { data, error } = await supabase
        .from("supplier_applications")
        .insert({
          applicant_user_id: user.id,
          business_name: input.business_name.trim(),
          owner_name: input.owner_name.trim() || null,
          phone: input.phone.trim() || null,
          email: input.email.trim() || null,
          province: input.province,
          city: input.city,
          address: input.address.trim() || null,
          description: input.description.trim() || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-application"] });
    },
  });
}

/* -------------------------------------------------------------- */
/* Supplier offers (supplier_products)                             */
/* -------------------------------------------------------------- */

export function supplierOffersKey(organizationId: string | null) {
  return ["supplier-offers", organizationId] as const;
}

export const supplierOffersQuery = (organizationId: string | null) =>
  queryOptions({
    queryKey: supplierOffersKey(organizationId),
    queryFn: async (): Promise<SupplierOffer[]> => {
      const { data, error } = await supabase
        .from("supplier_products")
        .select(
          "id, sku, unit_price, is_available, products ( id, name, unit, category )",
        )
        .eq("supplier_organization_id", organizationId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => {
        const r = row as unknown as {
          id: string;
          sku: string | null;
          unit_price: number;
          is_available: boolean;
          products: { id: string; name: string; unit: string | null; category: string | null } | null;
        };
        return {
          id: r.id,
          sku: r.sku,
          unit_price: Number(r.unit_price),
          is_available: r.is_available,
          product: r.products,
        };
      });
    },
  });

/**
 * Updates only price/availability of an offer. RLS (supplier_products_owner_*)
 * is the real authority: it re-checks that the caller is supplier_admin/owner
 * of the offer's supplier organization, so a forged id cannot be used.
 */
export function useUpdateSupplierOffer(organizationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      offerId: string;
      unit_price?: number;
      is_available?: boolean;
    }) => {
      const patch: { unit_price?: number; is_available?: boolean } = {};
      if (input.unit_price !== undefined) patch.unit_price = input.unit_price;
      if (input.is_available !== undefined) patch.is_available = input.is_available;

      const { error } = await supabase
        .from("supplier_products")
        .update(patch)
        .eq("id", input.offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierOffersKey(organizationId) });
    },
  });
}

/* -------------------------------------------------------------- */
/* Product submissions                                             */
/* -------------------------------------------------------------- */

export function supplierSubmissionsKey(organizationId: string | null) {
  return ["supplier-submissions", organizationId] as const;
}

export const supplierSubmissionsQuery = (organizationId: string | null) =>
  queryOptions({
    queryKey: supplierSubmissionsKey(organizationId),
    queryFn: async (): Promise<SupplierSubmission[]> => {
      const { data, error } = await supabase
        .from("product_submissions")
        .select(
          "id, proposed_name, proposed_category, proposed_brand, proposed_unit, proposed_price, proposed_sku, proposed_description, status, rejection_reason, created_at, approved_product_id",
        )
        .eq("supplier_organization_id", organizationId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        ...(row as SupplierSubmission),
        proposed_price:
          (row as SupplierSubmission).proposed_price === null
            ? null
            : Number((row as SupplierSubmission).proposed_price),
      }));
    },
  });

export type SubmissionInput = {
  proposed_name: string;
  proposed_description: string;
  proposed_category: string;
  proposed_brand: string;
  proposed_unit: string;
  proposed_price: string;
  proposed_sku: string;
};

export function useCreateSubmission(organizationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmissionInput) => {
      if (!organizationId) throw new Error("سازمان تأمین‌کننده پیدا نشد.");
      const price = Number(input.proposed_price);
      const { data, error } = await supabase
        .from("product_submissions")
        .insert({
          supplier_organization_id: organizationId,
          proposed_name: input.proposed_name.trim(),
          proposed_description: input.proposed_description.trim() || null,
          proposed_category: input.proposed_category.trim() || null,
          proposed_brand: input.proposed_brand.trim() || null,
          proposed_unit: input.proposed_unit.trim() || null,
          proposed_sku: input.proposed_sku.trim() || null,
          proposed_price: Number.isFinite(price) && price > 0 ? price : null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierSubmissionsKey(organizationId) });
    },
  });
}
