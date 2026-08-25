import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/page-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/catalog";
import { useSupplierOrganization } from "@/hooks/use-organizations";
import { supplierOrdersQuery, ORDER_STATUS_LABELS } from "@/lib/orders";
import { formatDate, formatNumber, formatToman } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/orders/")({
  head: () => ({
    meta: [
      { title: "سفارش‌های دریافتی | تأمینک" },
      { name: "description", content: "سفارش‌های ثبت‌شده توسط خریداران برای کسب‌وکار شما." },
    ],
  }),
  component: SupplierOrdersPage,
});

function SupplierOrdersPage() {
  const { organization, isPending: orgPending } = useSupplierOrganization();
  const query = useQuery({
    ...supplierOrdersQuery(organization?.id ?? null),
    enabled: Boolean(organization?.id),
  });

  return (
    <PageShell title="سفارش‌های دریافتی" description="سفارش‌های ثبت‌شده توسط خریداران">
      <div className="pb-24 md:pb-0">
        {orgPending ? (
          <LoadingState />
        ) : !organization ? (
          <EmptyState label="شما عضو هیچ تأمین‌کننده‌ای نیستید." />
        ) : query.isPending ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : (query.data ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <Inbox className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">هنوز سفارشی دریافت نشده است.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {(query.data ?? []).map((order) => (
              <li key={order.id}>
                <Link
                  to="/supplier/orders/$orderId"
                  params={{ orderId: order.id }}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/40"
                >
                  <div>
                    <p className="font-semibold">{order.buyerName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(order.created_at)} — {formatNumber(order.itemCount)} قلم کالا
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