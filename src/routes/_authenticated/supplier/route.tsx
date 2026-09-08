import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { PageShell } from "@/components/page-shell";
import { LoadingState } from "@/components/catalog";
import { Button } from "@/components/ui/button";
import { useSupplierMembership } from "@/lib/supplier";

export const Route = createFileRoute("/_authenticated/supplier")({
  component: SupplierLayout,
});

const TABS = [
  { to: "/supplier", label: "داشبورد", exact: true },
  { to: "/supplier/orders", label: "سفارش‌ها", exact: false },
  { to: "/supplier/sales", label: "فروش‌ها", exact: false },
  { to: "/supplier/invoices", label: "فاکتورها", exact: false },
  { to: "/supplier/products", label: "محصولات", exact: false },
  { to: "/supplier/submissions", label: "درخواست‌های محصول", exact: false },
  { to: "/supplier/profile", label: "پروفایل", exact: false },
] as const;

function SupplierLayout() {
  const { isPending, organization, isApproved } = useSupplierMembership();

  if (isPending) {
    return (
      <PageShell title="پنل فروشنده">
        <LoadingState />
      </PageShell>
    );
  }

  if (!organization || !isApproved) {
    return (
      <PageShell title="پنل فروشنده" description="این بخش مخصوص تأمین‌کننده‌های تأیید شده است">
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">شما هنوز تأمین‌کننده تأیید شده‌ای نیستید.</p>
          <Button asChild className="mt-4">
            <Link to="/become-supplier">درخواست فروشندگی</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-card">
        <span className="px-2 text-sm font-semibold">{organization.name}</span>
        <nav className="flex flex-wrap gap-1">
          {TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: tab.exact }}
              className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-muted text-foreground font-medium" }}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
