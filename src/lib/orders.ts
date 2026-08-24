import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار تأیید",
  confirmed: "تأیید شده",
  rejected: "رد شده",
  completed: "تکمیل شده",
  cancelled: "لغو شده",
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

// orders has two FKs to organizations (buyer + supplier); disambiguate
// with the constraint name or PostgREST throws an "ambiguous embed" error.
const ORDER_SUPPLIER_JOIN = "organizations!orders_supplier_organization_id_fkey ( id, name )";

export function ordersKey(organizationId: string | null) {
  return ["orders", organizationId] as const;
}

export function orderKey(orderId: string) {
  return ["order", orderId] as const;
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