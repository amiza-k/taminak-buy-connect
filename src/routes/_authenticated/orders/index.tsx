import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/page-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/catalog";
import { useBuyerOrganization } from "@/lib/cart";
import { ordersQuery, ORDER_STATUS_LABELS } from "@/lib/orders";
import { formatDate, formatToman } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/orders/")({
  head: () => ({
    meta: [
      { title: "سفارش‌های من | تأمینک" },
      { name: "description", content: "پیگیری سفارش‌های ثبت‌شده کسب‌وکار شما در تأمینک." },
    ],
  }),
  component: BuyerOrdersPage,
});

function BuyerOrdersPage() {
  const { organization, isPending: orgPending } = useBuyerOrganization();
  const query = useQuery({
    ...ordersQuery(organization?.id ?? null),
    enabled: Boolean(organization?.id),
  });

  return (
    <PageShell title="سفارش‌های من" description="سفارش‌های ثبت‌شده برای کسب‌وکار شما">
      <div className="pb-24 md:pb-0">
        {orgPending ? (
          <LoadingState />
        ) : !organization ? (
          <EmptyState label="ابتدا کسب‌وکار خود را ثبت کنید." />
        ) : query.isPending ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : (query.data ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <Inbox className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">هنوز سفارشی ثبت نکرده‌اید.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {(query.data ?? []).map((order) => (
              <li key={order.id}>
                <Link
                  to="/orders/$orderId"
                  params={{ orderId: order.id }}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/40"
                >
                  <div>
                    <p className="font-semibold">{order.supplierName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </Badge>
                    <p className="font-bold text-primary">{formatToman(order.total)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
