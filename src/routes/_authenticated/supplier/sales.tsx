import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ErrorState, LoadingState } from "@/components/catalog";
import { useSupplierMembership } from "@/lib/supplier";
import { supplierSalesQuery, ORDER_STATUS_LABELS } from "@/lib/orders";
import { formatDate, formatNumber, formatToman } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/supplier/sales")({
  head: () => ({ meta: [{ title: "فروش‌ها | تأمینک" }] }),
  component: SupplierSalesPage,
});

function SupplierSalesPage() {
  const { organization, isPending: orgPending } = useSupplierMembership();
  const orgId = organization?.id ?? null;
  const query = useQuery({ ...supplierSalesQuery(orgId), enabled: Boolean(orgId) });

  if (orgPending || query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  const sales = query.data ?? [];
  if (sales.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <Inbox className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">هنوز فروشی ثبت نشده است.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {sales.map((sale) => (
        <li key={sale.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold">{sale.buyerName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(sale.created_at)} — شماره سفارش: {sale.id.slice(0, 8)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{ORDER_STATUS_LABELS[sale.status] ?? sale.status}</Badge>
              <p className="font-bold text-primary">{formatToman(sale.total)}</p>
            </div>
          </div>
          <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm text-muted-foreground">
            {sale.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between">
                <span>{item.product_name}</span>
                <span>{formatNumber(item.quantity)} عدد</span>
              </li>
            ))}
          </ul>
          <Link
            to="/supplier/orders/$orderId"
            params={{ orderId: sale.id }}
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            مشاهده جزئیات سفارش
          </Link>
        </li>
      ))}
    </ul>
  );
}