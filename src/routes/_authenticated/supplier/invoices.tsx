import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/catalog";
import { useSupplierMembership } from "@/lib/supplier";
import { supplierOrdersQuery, ORDER_STATUS_LABELS } from "@/lib/orders";
import { formatDate, formatToman } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/supplier/invoices")({
  head: () => ({ meta: [{ title: "فاکتورها | تأمینک" }] }),
  component: SupplierInvoicesPage,
});

function SupplierInvoicesPage() {
  const { organization, isPending: orgPending } = useSupplierMembership();
  const orgId = organization?.id ?? null;
  const query = useQuery({ ...supplierOrdersQuery(orgId), enabled: Boolean(orgId) });

  if (orgPending || query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  const invoices = query.data ?? [];
  if (invoices.length === 0) {
    return <EmptyState label="هنوز فاکتوری صادر نشده است." />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      {invoices.map((order, index) => (
        <div
          key={order.id}
          className={`flex flex-wrap items-center justify-between gap-3 p-4 ${
            index > 0 ? "border-t border-border" : ""
          }`}
        >
          <div>
            <p className="font-semibold">{order.buyerName}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              شماره فاکتور: {order.id.slice(0, 8)} — {formatDate(order.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{ORDER_STATUS_LABELS[order.status] ?? order.status}</Badge>
            <p className="font-bold text-primary">{formatToman(order.total)}</p>
            <Link
              to="/supplier/orders/$orderId"
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
  );
}