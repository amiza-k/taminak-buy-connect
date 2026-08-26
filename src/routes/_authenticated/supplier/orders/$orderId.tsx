import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/page-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/catalog";
import { InvoiceSheet, PrintInvoiceButton } from "@/components/invoice";
import { useSupplierOrganization } from "@/hooks/use-organizations";
import {
  supplierOrderQuery,
  useUpdateOrderStatus,
  ORDER_STATUS_LABELS,
  SUPPLIER_STATUS_ACTIONS,
} from "@/lib/orders";
import { formatDate, formatNumber, formatToman } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/supplier/orders/$orderId")({
  head: () => ({
    meta: [
      { title: "جزئیات سفارش دریافتی | تأمینک" },
      { name: "description", content: "بررسی و تغییر وضعیت سفارش دریافتی." },
    ],
  }),
  component: SupplierOrderDetailPage,
});

function SupplierOrderDetailPage() {
  const { orderId } = Route.useParams();
  const { organization, isPending: orgPending } = useSupplierOrganization();
  const query = useQuery(supplierOrderQuery(orderId));
  const updateStatus = useUpdateOrderStatus();

  if (orgPending || query.isPending) {
    return (
      <PageShell title="سفارش">
        <LoadingState />
      </PageShell>
    );
  }
  if (query.isError) {
    return (
      <PageShell title="سفارش">
        <ErrorState onRetry={() => query.refetch()} />
      </PageShell>
    );
  }

  const order = query.data;

  // Defense in depth: even though RLS already scopes which rows are
  // readable, a buyer could open this supplier-only URL for their own order.
  // Only show it as a supplier order if it actually belongs to the
  // authenticated user's supplier organization.
  if (!order || !organization || order.supplier_organization_id !== organization.id) {
    return (
      <PageShell title="سفارش">
        <EmptyState label="سفارشی پیدا نشد." />
      </PageShell>
    );
  }

  const actions = SUPPLIER_STATUS_ACTIONS[order.status] ?? [];

  function handleTransition(nextStatus: string) {
    if (!organization) return;
    updateStatus.mutate(
      { orderId: order!.id, status: nextStatus, supplierOrganizationId: organization.id },
      {
        onSuccess: () => toast.success("وضعیت سفارش به‌روزرسانی شد."),
        onError: () => toast.error("تغییر وضعیت سفارش انجام نشد. لطفاً دوباره تلاش کنید."),
      },
    );
  }

  return (
    <PageShell
      title={`سفارش از ${order.buyerName}`}
      description={formatDate(order.created_at)}
      actions={<PrintInvoiceButton />}
    >
      <InvoiceSheet
        orderId={order.id}
        counterpartyLabel="خریدار"
        counterpartyName={order.buyerName}
        createdAt={order.created_at}
        items={order.items}
        subtotal={order.subtotal}
        total={order.total}
        deliveryAddress={order.delivery_address}
        contactPhone={order.contact_phone}
        note={order.note}
      />
      <div className="grid gap-6 pb-24 md:pb-0 lg:grid-cols-[1fr_320px] print:hidden">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            {order.items.map((item, index) => (
              <div
                key={item.id}
                className={`flex flex-wrap items-center justify-between gap-3 p-4 text-sm ${
                  index > 0 ? "border-t border-border" : ""
                }`}
              >
                <span>{item.product_name}</span>
                <span className="text-muted-foreground">
                  {formatNumber(item.quantity)} × {formatToman(item.unit_price)}
                </span>
                <span className="font-semibold text-primary">{formatToman(item.subtotal)}</span>
              </div>
            ))}
          </div>

          {order.note ? (
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-sm font-semibold">توضیحات خریدار</p>
              <p className="mt-1 text-sm text-muted-foreground">{order.note}</p>
            </div>
          ) : null}
        </div>

        <aside className="h-fit space-y-3 rounded-xl border border-border bg-card p-5 shadow-card lg:sticky lg:top-20">
          <Badge variant="secondary">{ORDER_STATUS_LABELS[order.status] ?? order.status}</Badge>
          {order.delivery_address ? (
            <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-4" />
              {order.delivery_address}
            </p>
          ) : null}
          {order.contact_phone ? (
            <p className="inline-flex items-center gap-1 text-sm text-muted-foreground" dir="ltr">
              <Phone className="size-4" />
              {order.contact_phone}
            </p>
          ) : null}
          <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
            <span>مبلغ کل:</span>
            <span className="text-lg font-bold text-primary">{formatToman(order.total)}</span>
          </div>

          {actions.length > 0 ? (
            <div className="space-y-2 border-t border-border pt-3">
              {actions.map((action) => (
                <Button
                  key={action.status}
                  className="w-full"
                  variant={action.status === "rejected" ? "outline" : "default"}
                  disabled={updateStatus.isPending}
                  onClick={() => handleTransition(action.status)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          ) : null}
        </aside>
      </div>
    </PageShell>
  );
}
