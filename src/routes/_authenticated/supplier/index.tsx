import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, FileClock, Package, User } from "lucide-react";

import { LoadingState, ErrorState } from "@/components/catalog";
import {
  useSupplierMembership,
  supplierOrderCountsQuery,
  supplierOffersQuery,
  supplierSubmissionsQuery,
} from "@/lib/supplier";
import { formatNumber } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/supplier/")({
  head: () => ({ meta: [{ title: "داشبورد فروشنده | تأمینک" }] }),
  component: SupplierDashboardPage,
});

function StatCard({ label, value, to }: { label: string; value: number; to: string }) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/40"
    >
      <p className="text-2xl font-bold text-primary">{formatNumber(value)}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </Link>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: typeof Package; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/40"
    >
      <Icon className="size-5 text-primary" />
      {label}
    </Link>
  );
}

function SupplierDashboardPage() {
  const { organization } = useSupplierMembership();
  const orgId = organization?.id ?? null;

  const counts = useQuery({ ...supplierOrderCountsQuery(orgId), enabled: Boolean(orgId) });
  const offers = useQuery({ ...supplierOffersQuery(orgId), enabled: Boolean(orgId) });
  const submissions = useQuery({ ...supplierSubmissionsQuery(orgId), enabled: Boolean(orgId) });

  if (counts.isPending || offers.isPending || submissions.isPending) {
    return <LoadingState />;
  }
  if (counts.isError || offers.isError || submissions.isError) {
    return (
      <ErrorState
        onRetry={() => {
          counts.refetch();
          offers.refetch();
          submissions.refetch();
        }}
      />
    );
  }

  const activeOffers = (offers.data ?? []).filter((o) => o.is_available).length;
  const pendingSubmissions = (submissions.data ?? []).filter((s) => s.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="سفارش‌های در انتظار"
          value={counts.data?.pending ?? 0}
          to="/supplier/orders"
        />
        <StatCard
          label="سفارش‌های تأییدشده"
          value={counts.data?.confirmed ?? 0}
          to="/supplier/orders"
        />
        <StatCard
          label="سفارش‌های تکمیل‌شده"
          value={counts.data?.completed ?? 0}
          to="/supplier/orders"
        />
        <StatCard label="محصولات فعال" value={activeOffers} to="/supplier/products" />
        <StatCard
          label="درخواست‌های در انتظار"
          value={pendingSubmissions}
          to="/supplier/submissions"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink to="/supplier/orders" icon={ClipboardList} label="سفارش‌ها" />
        <QuickLink to="/supplier/products" icon={Package} label="محصولات" />
        <QuickLink to="/supplier/submissions" icon={FileClock} label="درخواست‌های محصول" />
        <QuickLink to="/supplier/profile" icon={User} label="پروفایل فروشنده" />
      </div>
    </div>
  );
}
