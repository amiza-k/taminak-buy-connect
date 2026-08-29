import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { LoadingState } from "@/components/catalog";
import { usePlatformAdmin } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const ADMIN_TABS = [
  { to: "/admin", label: "داشبورد", exact: true },
  { to: "/admin/products", label: "محصولات", exact: false },
  { to: "/admin/categories", label: "دسته‌بندی‌ها", exact: false },
  { to: "/admin/supplier-applications", label: "درخواست‌های فروشندگی", exact: false },
  { to: "/admin/product-submissions", label: "درخواست‌های محصول", exact: false },
] as const;

function AdminLayout() {
  const { isAdmin, isPending } = usePlatformAdmin();

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <LoadingState />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold">دسترسی غیرمجاز</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          این بخش فقط برای مدیران پلتفرم قابل مشاهده است.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-card">
        <span className="px-2 text-sm font-semibold">پنل مدیریت</span>
        <nav className="flex flex-wrap gap-1">
          {ADMIN_TABS.map((tab) => (
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