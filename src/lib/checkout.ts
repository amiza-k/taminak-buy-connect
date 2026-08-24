import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { cartKey } from "@/lib/cart";
import { ordersKey } from "@/lib/orders";

export type CheckoutResult = {
  orderId: string;
  supplierOrganizationId: string;
  total: number;
};

export type CheckoutInput = {
  cartId: string;
  organizationId: string;
  deliveryAddress: string;
  contactPhone: string;
  note?: string;
};

async function checkoutCart(input: CheckoutInput): Promise<CheckoutResult[]> {
  const { data, error } = await supabase.rpc("checkout_cart", {
    p_cart_id: input.cartId,
    p_delivery_address: input.deliveryAddress,
    p_contact_phone: input.contactPhone,
    ...(input.note ? { p_note: input.note } : {}),
  });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    orderId: row.order_id,
    supplierOrganizationId: row.supplier_organization_id,
    total: Number(row.total),
  }));
}

/**
 * Atomically converts the active cart into one order per supplier via the
 * `checkout_cart` RPC (see supabase/migrations). All-or-nothing: a failure
 * midway never leaves partial orders behind.
 */
export function useCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: checkoutCart,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: cartKey(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: ordersKey(variables.organizationId) });
    },
  });
}