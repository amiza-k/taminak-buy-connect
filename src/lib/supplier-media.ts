import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type SupplierOfferMedia = {
  id: string;
  media_type: "image" | "video";
  storage_path: string;
  sort_order: number;
  url: string;
};

export const OFFER_MEDIA_BUCKET = "supplier-offer-media";
const BUCKET = OFFER_MEDIA_BUCKET;

export function offerMediaKey(supplierProductId: string) {
  return ["offer-media", supplierProductId] as const;
}

export const offerMediaQuery = (supplierProductId: string) =>
  queryOptions({
    queryKey: offerMediaKey(supplierProductId),
    queryFn: async (): Promise<SupplierOfferMedia[]> => {
      const { data, error } = await supabase
        .from("supplier_offer_media")
        .select("id, media_type, storage_path, sort_order")
        .eq("supplier_product_id", supplierProductId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        ...(row as {
          id: string;
          media_type: "image" | "video";
          storage_path: string;
          sort_order: number;
        }),
        url: supabase.storage.from(BUCKET).getPublicUrl(row.storage_path).data.publicUrl,
      }));
    },
  });

/**
 * Uploads one file for a supplier's own offer and records it. Storage RLS
 * (supplier_offer_media_storage_write) independently re-checks that the
 * caller holds supplier_admin/owner in the org named by the path's first
 * segment, so a forged supplierOrganizationId here cannot bypass ownership.
 */
export function useUploadOfferMedia(supplierProductId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      file: File;
      supplierOrganizationId: string;
      mediaType: "image" | "video";
      sortOrder: number;
    }) => {
      const ext = input.file.name.split(".").pop() ?? "bin";
      const path = `${input.supplierOrganizationId}/${supplierProductId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, input.file);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("supplier_offer_media").insert({
        supplier_product_id: supplierProductId,
        media_type: input.mediaType,
        storage_path: path,
        sort_order: input.sortOrder,
      });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offerMediaKey(supplierProductId) });
    },
  });
}

export function useDeleteOfferMedia(supplierProductId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (media: { id: string; storage_path: string }) => {
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([media.storage_path]);
      if (storageError) throw storageError;

      const { error } = await supabase.from("supplier_offer_media").delete().eq("id", media.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offerMediaKey(supplierProductId) });
    },
  });
}

export type SupplierOfferMediaMap = Record<string, SupplierOfferMedia[]>;

/**
 * Fetches media for many offers in a single request (avoids N+1 when
 * rendering a grid/list of supplier offers, e.g. on /suppliers).
 */
export const offerMediaBulkQuery = (supplierProductIds: string[]) =>
  queryOptions({
    queryKey: ["offer-media-bulk", [...supplierProductIds].sort()],
    queryFn: async (): Promise<SupplierOfferMediaMap> => {
      if (supplierProductIds.length === 0) return {};
      const { data, error } = await supabase
        .from("supplier_offer_media")
        .select("id, media_type, storage_path, sort_order, supplier_product_id")
        .in("supplier_product_id", supplierProductIds)
        .order("sort_order", { ascending: true });
      if (error) throw error;

      const grouped: SupplierOfferMediaMap = {};
      for (const row of data ?? []) {
        const url = supabase.storage.from(OFFER_MEDIA_BUCKET).getPublicUrl(row.storage_path)
          .data.publicUrl;
        const entry: SupplierOfferMedia = {
          id: row.id,
          media_type: row.media_type as "image" | "video",
          storage_path: row.storage_path,
          sort_order: row.sort_order,
          url,
        };
        (grouped[row.supplier_product_id] ??= []).push(entry);
      }
      return grouped;
    },
  });
