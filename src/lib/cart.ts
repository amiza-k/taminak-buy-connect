import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useMyMemberships } from "@/hooks/use-organizations";

export type CartItemRow = {
  id: string;
  quantity: number;
  supplier_product_id: string;
  supplier_products: {
    id: string;
    unit_price: number;
    is_available: boolean;
    supplier_organization_id: string;
    products: { id: string; name: string; unit: string | null; image_url: string | null } | null;
    organizations: {
      id: string;
      name: string;
      city: string | null;
      province: string | null;
    } | null;
  } | null;
};

export type CartData = {
  cartId: string | null;
  items: CartItemRow[];
};

export type SupplierGroup = {
  supplierId: string;
  supplierName: string;
  supplierCity: string | null;
  supplierProvince: string | null;
  items: CartItemRow[];
  subtotal: number;
};

const CART_ITEM_SELECT =
  "id, quantity, supplier_product_id, supplier_products ( id, unit_price, is_available, supplier_organization_id, products ( id, name, unit, image_url ), organizations ( id, name, city, province ) )";

export function cartKey(organizationId: string | null) {
  return ["cart", organizationId] as const;
}

/** The buyer (restaurant/café) organization the current user belongs to. */
export function useBuyerOrganization() {
  const { data: memberships, isPending } = useMyMemberships();
  const organization = useMemo(
    () =>
      (memberships ?? []).find((m) => m.organizations && m.organizations.type !== "supplier")
        ?.organizations ?? null,
    [memberships],
  );
  return { organization, isPending };
}

async function fetchActiveCartId(organizationId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("carts")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

async function ensureActiveCartId(organizationId: string, userId: string): Promise<string> {
  const existing = await fetchActiveCartId(organizationId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("carts")
    .insert({ organization_id: organizationId, created_by: userId, status: "active" })
    .select("id")
    .single();
  if (error) {
    // Another tab may have created it concurrently.
    const retry = await fetchActiveCartId(organizationId);
    if (retry) return retry;
    throw error;
  }
  return data.id;
}

async function fetchCart(organizationId: string): Promise<CartData> {
  const cartId = await fetchActiveCartId(organizationId);
  if (!cartId) return { cartId: null, items: [] };

  const { data, error } = await supabase
    .from("cart_items")
    .select(CART_ITEM_SELECT)
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  return { cartId, items: (data ?? []) as unknown as CartItemRow[] };
}

export function useCart() {
  const { organization } = useBuyerOrganization();
  const organizationId = organization?.id ?? null;

  return useQuery({
    queryKey: cartKey(organizationId),
    enabled: Boolean(organizationId),
    queryFn: () => fetchCart(organizationId!),
  });
}

/** Total number of units in the cart (0 when signed out or cart empty). */
export function useCartCount(): number {
  const { data } = useCart();
  return (data?.items ?? []).reduce((sum, item) => sum + Number(item.quantity), 0);
}

export function useCartMutations() {
  const queryClient = useQueryClient();
  const { organization } = useBuyerOrganization();
  const organizationId = organization?.id ?? null;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: cartKey(organizationId) });

  const addItem = useMutation({
    mutationFn: async ({
      supplierProductId,
      userId,
      quantity = 1,
    }: {
      supplierProductId: string;
      userId: string;
      quantity?: number;
    }) => {
      if (!organizationId) throw new Error("no-organization");
      const cartId = await ensureActiveCartId(organizationId, userId);

      const { data: existing, error: findError } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cartId)
        .eq("supplier_product_id", supplierProductId)
        .maybeSingle();
      if (findError) throw findError;

      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: Number(existing.quantity) + quantity })
          .eq("id", existing.id);
        if (error) throw error;
        return;
      }

      const { error } = await supabase
        .from("cart_items")
        .insert({ cart_id: cartId, supplier_product_id: supplierProductId, quantity });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const setQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { addItem, setQuantity, removeItem };
}

export function itemSubtotal(item: CartItemRow): number {
  return Number(item.supplier_products?.unit_price ?? 0) * Number(item.quantity);
}

export function groupBySupplier(items: CartItemRow[]): SupplierGroup[] {
  const groups = new Map<string, SupplierGroup>();
  for (const item of items) {
    const offer = item.supplier_products;
    const supplierId = offer?.supplier_organization_id ?? "unknown";
    let group = groups.get(supplierId);
    if (!group) {
      group = {
        supplierId,
        supplierName: offer?.organizations?.name ?? "تأمین‌کننده",
        supplierCity: offer?.organizations?.city ?? null,
        supplierProvince: offer?.organizations?.province ?? null,
        items: [],
        subtotal: 0,
      };
      groups.set(supplierId, group);
    }
    group.items.push(item);
    group.subtotal += itemSubtotal(item);
  }
  return [...groups.values()];
}

export function cartTotals(items: CartItemRow[]) {
  const itemCount = items.length;
  const unitCount = items.reduce((sum, item) => sum + Number(item.quantity), 0);
  const supplierCount = new Set(
    items.map((item) => item.supplier_products?.supplier_organization_id ?? "unknown"),
  ).size;
  const subtotal = items.reduce((sum, item) => sum + itemSubtotal(item), 0);
  return { itemCount, unitCount, supplierCount, subtotal };
}
