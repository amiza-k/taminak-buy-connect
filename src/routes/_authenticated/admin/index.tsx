import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { LoadingState, ErrorState } from "@/components/catalog";
import { adminDashboardQuery } from "@/lib/admin";
import { formatNumber } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "داشبورد مدیریت | تأمینک" }] }),
  component: AdminDashboardPage,
});

function StatCard({ label, value, to }: { label: string; value: number; to?: string }) {
  const content = (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/40">
      <p className="text-2xl font-bold text-primary">{formatNumber(value)}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

function AdminDashboardPage() {
  const query = useQuery(adminDashboardQuery());

  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  const data = query.data;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        label="درخواست‌های فروشندگی در انتظار"
        value={data.pending_supplier_applications}
        to="/admin/supplier-applications"
      />
      <StatCard
        label="درخواست‌های محصول در انتظار"
        value={data.pending_product_submissions}
        to="/admin/product-submissions"
      />
      <StatCard label="تأمین‌کنندگان تأیید شده" value={data.approved_suppliers} />
      <StatCard label="محصولات فعال" value={data.active_products} />
      <StatCard label="سفارش‌های ۳۰ روز اخیر" value={data.recent_orders_count} />
    </div>
  );
}
