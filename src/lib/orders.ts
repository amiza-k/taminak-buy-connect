import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار تأیید",
  confirmed: "تأیید شده",
  rejected: "رد شده",
  completed: "تکمیل شده",
  cancelled: "لغو شده",
};

/**
 * Valid supplier-initiated transitions out of each status, per
 * orders_status_check (pending, confirmed, rejected, completed, cancelled)
 * and the workflow enforced by the update_order_status RPC.
 * Terminal statuses (rejected, completed, cancelled) map to an empty array.
 */
export const SUPPLIER_STATUS_ACTIONS: Record<string, { status: string; label: string }[]> = {
  pending: [
    { status: "confirmed", label: "تأیید سفارش" },
    { status: "rejected", label: "رد سفارش" },
  ],
  confirmed: [{ status: "completed", label: "تکمیل سفارش" }],
  rejected: [],
  completed: [],
  cancelled: [],
};

export type OrderSummary = {
  id: string;
  status: string;
  subtotal: number;
  total: number;
  created_at: string;
  supplier_organization_id: string;
  supplierName: string;
};

export type SupplierOrderSummary = {
  id: string;
  status: string;
  subtotal: number;
  total: number;
  created_at: string;
  buyer_organization_id: string;
  buyerName: string;
  itemCount: number;
};

export type OrderItemRow = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

export type OrderDetail = {
  id: string;
  status: string;
  subtotal: number;
  total: number;
  created_at: string;
  delivery_address: string | null;
  contact_phone: string | null;
  note: string | null;
  supplier_organization_id: string;
  supplierName: string;
  items: OrderItemRow[];
};

export type SupplierOrderDetail = {
  id: string;
  status: string;
  subtotal: number;
  total: number;
  created_at: string;
  delivery_address: string | null;
  contact_phone: string | null;
  note: string | null;
  buyer_organization_id: string;
  supplier_organization_id: string;
  buyerName: string;
  items: OrderItemRow[];
};

// orders has two FKs to organizations (buyer + supplier); disambiguate
// with the constraint name or PostgREST throws an "ambiguous embed" error.
const ORDER_SUPPLIER_JOIN = "organizations!orders_supplier_organization_id_fkey ( id, name )";
const ORDER_BUYER_JOIN = "organizations!orders_buyer_organization_id_fkey ( id, name )";

export function ordersKey(organizationId: string | null) {
  return ["orders", organizationId] as const;
}

export function orderKey(orderId: string) {
  return ["order", orderId] as const;
}

export function supplierOrdersKey(organizationId: string | null) {
  return ["supplier-orders", organizationId] as const;
}

export function supplierOrderKey(orderId: string) {
  return ["supplier-order", orderId] as const;
}

async function fetchOrders(organizationId: string): Promise<OrderSummary[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, status, subtotal, total, created_at, supplier_organization_id, ${ORDER_SUPPLIER_JOIN}`,
    )
    .eq("buyer_organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      status: string;
      subtotal: number;
      total: number;
      created_at: string;
      supplier_organization_id: string;
      organizations: { id: string; name: string } | null;
    };
    return {
      id: r.id,
      status: r.status,
      subtotal: Number(r.subtotal),
      total: Number(r.total),
      created_at: r.created_at,
      supplier_organization_id: r.supplier_organization_id,
      supplierName: r.organizations?.name ?? "تأمین‌کننده",
    };
  });
}

async function fetchOrder(orderId: string): Promise<OrderDetail | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, status, subtotal, total, created_at, delivery_address, contact_phone, note, supplier_organization_id, ${ORDER_SUPPLIER_JOIN}, order_items ( id, product_id, product_name, quantity, unit_price, subtotal )`,
    )
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as {
    id: string;
    status: string;
    subtotal: number;
    total: number;
    created_at: string;
    delivery_address: string | null;
    contact_phone: string | null;
    note: string | null;
    supplier_organization_id: string;
    organizations: { id: string; name: string } | null;
    order_items: OrderItemRow[] | null;
  };

  return {
    id: row.id,
    status: row.status,
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    created_at: row.created_at,
    delivery_address: row.delivery_address,
    contact_phone: row.contact_phone,
    note: row.note,
    supplier_organization_id: row.supplier_organization_id,
    supplierName: row.organizations?.name ?? "تأمین‌کننده",
    items: (row.order_items ?? []).map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      subtotal: Number(item.subtotal),
    })),
  };
}

async function fetchSupplierOrders(organizationId: string): Promise<SupplierOrderSummary[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, status, subtotal, total, created_at, buyer_organization_id, ${ORDER_BUYER_JOIN}, order_items ( id )`,
    )
    .eq("supplier_organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      status: string;
      subtotal: number;
      total: number;
      created_at: string;
      buyer_organization_id: string;
      organizations: { id: string; name: string } | null;
      order_items: { id: string }[] | null;
    };
    return {
      id: r.id,
      status: r.status,
      subtotal: Number(r.subtotal),
      total: Number(r.total),
      created_at: r.created_at,
      buyer_organization_id: r.buyer_organization_id,
      buyerName: r.organizations?.name ?? "خریدار",
      itemCount: (r.order_items ?? []).length,
    };
  });
}

async function fetchSupplierOrder(orderId: string): Promise<SupplierOrderDetail | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, status, subtotal, total, created_at, delivery_address, contact_phone, note, buyer_organization_id, supplier_organization_id, ${ORDER_BUYER_JOIN}, order_items ( id, product_id, product_name, quantity, unit_price, subtotal )`,
    )
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as {
    id: string;
    status: string;
    subtotal: number;
    total: number;
    created_at: string;
    delivery_address: string | null;
    contact_phone: string | null;
    note: string | null;
    buyer_organization_id: string;
    supplier_organization_id: string;
    organizations: { id: string; name: string } | null;
    order_items: OrderItemRow[] | null;
  };

  return {
    id: row.id,
    status: row.status,
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    created_at: row.created_at,
    delivery_address: row.delivery_address,
    contact_phone: row.contact_phone,
    note: row.note,
    buyer_organization_id: row.buyer_organization_id,
    supplier_organization_id: row.supplier_organization_id,
    buyerName: row.organizations?.name ?? "خریدار",
    items: (row.order_items ?? []).map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      subtotal: Number(item.subtotal),
    })),
  };
}

export const ordersQuery = (organizationId: string | null) =>
  queryOptions({
    queryKey: ordersKey(organizationId),
    queryFn: () => fetchOrders(organizationId!),
  });

export const orderQuery = (orderId: string) =>
  queryOptions({
    queryKey: orderKey(orderId),
    queryFn: () => fetchOrder(orderId),
  });

export const supplierOrdersQuery = (organizationId: string | null) =>
  queryOptions({
    queryKey: supplierOrdersKey(organizationId),
    queryFn: () => fetchSupplierOrders(organizationId!),
  });

export const supplierOrderQuery = (orderId: string) =>
  queryOptions({
    queryKey: supplierOrderKey(orderId),
    queryFn: () => fetchSupplierOrder(orderId),
  });

/**
 * Moves an order to a new status via the update_order_status RPC. The RPC
 * (not this client code) is the actual authority: it re-checks that the
 * caller is a member of the order's supplier organization and that the
 * transition is valid, so this mutation cannot be used to bypass those rules.
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { orderId: string; status: string; supplierOrganizationId: string }) => {
      const { data, error } = await supabase.rpc("update_order_status", {
        p_order_id: input.orderId,
        p_status: input.status,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: supplierOrderKey(variables.orderId) });
      queryClient.invalidateQueries({
        queryKey: supplierOrdersKey(variables.supplierOrganizationId),
      });
    },
  });
}