import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/page-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/catalog";
import { useBuyerOrganization } from "@/lib/cart";
import { ordersQuery, ORDER_STATUS_LABELS } from "@/lib/orders";
import { formatDate, formatNumber, formatToman } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/account/invoices")({
  head: () => ({ meta: [{ title: "فاکتورهای من | تأمینک" }] }),
  component: BuyerInvoicesPage,
});

function BuyerInvoicesPage() {
  const { organization, isPending: orgPending } = useBuyerOrganization();
  const query = useQuery({
    ...ordersQuery(organization?.id ?? null),
    enabled: Boolean(organization?.id),
  });

  return (
    <PageShell title="فاکتورهای من" description="فاکتور سفارش‌های ثبت‌شده شما نزد هر تأمین‌کننده">
      {orgPending ? (
        <LoadingState />
      ) : !organization ? (
        <EmptyState label="ابتدا کسب‌وکار خود را ثبت کنید." />
      ) : query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState label="هنوز فاکتوری صادر نشده است." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          {(query.data ?? []).map((order, index) => (
            <div
              key={order.id}
              className={`flex flex-wrap items-center justify-between gap-3 p-4 ${
                index > 0 ? "border-t border-border" : ""
              }`}
            >
              <div>
                <p className="font-semibold">{order.supplierName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  شماره فاکتور: {order.id.slice(0, 8)} — {formatDate(order.created_at)} —{" "}
                  {formatNumber(order.itemCount)} قلم کالا
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </Badge>
                <p className="font-bold text-primary">{formatToman(order.total)}</p>
                <Link
                  to="/orders/$orderId"
                  params={{ orderId: order.id }}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  <Printer className="size-4" />
                  مشاهده و چاپ
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
