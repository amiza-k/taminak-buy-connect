import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/page-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/catalog";
import { orderQuery, ORDER_STATUS_LABELS } from "@/lib/orders";
import { formatDate, formatNumber, formatToman } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/orders/$orderId")({
  head: () => ({
    meta: [
      { title: "جزئیات سفارش | تأمینک" },
      { name: "description", content: "وضعیت و جزئیات سفارش ثبت‌شده برای تأمین‌کننده." },
    ],
  }),
  component: BuyerOrderDetailPage,
});

function BuyerOrderDetailPage() {
  const { orderId } = Route.useParams();
  const query = useQuery(orderQuery(orderId));

  if (query.isPending) {
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

  // RLS already scopes which orders are readable to the buyer's own
  // organization; a null result here means "not found or not permitted".
  if (!order) {
    return (
      <PageShell title="سفارش">
        <EmptyState label="سفارشی پیدا نشد." />
      </PageShell>
    );
  }

  return (
    <PageShell title={`سفارش از ${order.supplierName}`} description={formatDate(order.created_at)}>
      <div className="grid gap-6 pb-24 md:pb-0 lg:grid-cols-[1fr_320px]">
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
              <p className="text-sm font-semibold">توضیحات شما</p>
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
        </aside>
      </div>
    </PageShell>
  );
}
