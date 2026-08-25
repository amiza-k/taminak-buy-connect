import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, ClipboardList, MapPin, Shield, Store, User } from "lucide-react";

import { PageShell } from "@/components/page-shell";
import { LocationPicker } from "@/components/location-picker";
import { useAuth } from "@/hooks/use-auth";
import { useSupplierMembership } from "@/lib/supplier";
import { usePlatformAdmin } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "حساب من | تأمینک" },
      { name: "description", content: "اطلاعات حساب، کسب‌وکار و دسترسی فروشندگی شما." },
    ],
  }),
  component: AccountPage,
});

function AccountRow({ to, icon: Icon, label }: { to: string; icon: typeof User; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-lg border border-border p-4 text-sm hover:bg-muted">
      <Icon className="size-4 text-primary" />
      {label}
    </Link>
  );
}

function AccountPage() {
  const { user } = useAuth();
  const { organization, isApproved } = useSupplierMembership();
  const { isAdmin } = usePlatformAdmin();

  return (
    <PageShell title="حساب من" description={user?.email ?? undefined}>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-base font-semibold">اطلاعات حساب</h2>
          <div className="space-y-2 rounded-xl border border-border bg-card p-2 shadow-card">
            <AccountRow to="/onboarding" icon={Building2} label="کسب‌وکار من" />
            <AccountRow to="/orders" icon={ClipboardList} label="سفارش‌های من" />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            شهر و محدوده جست‌وجو
            <LocationPicker className="ms-auto" />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">برای فروشندگان</h2>
          {isApproved && organization ? (
            <div className="space-y-2 rounded-xl border border-border bg-card p-2 shadow-card">
              <AccountRow to="/supplier" icon={Store} label="داشبورد فروشنده" />
              <AccountRow to="/supplier/products" icon={Store} label="محصولات" />
              <AccountRow to="/supplier/orders" icon={ClipboardList} label="سفارش‌های فروشنده" />
              <AccountRow to="/supplier/profile" icon={User} label="پروفایل فروشنده" />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">محصولات خود را در تأمینک عرضه کنید.</p>
              <Link to="/become-supplier" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                فروشنده شوید
              </Link>
            </div>
          )}
        </section>

        {isAdmin ? (
          <section className="space-y-3 lg:col-span-2">
            <h2 className="text-base font-semibold">مدیریت پلتفرم</h2>
            <div className="rounded-xl border border-border bg-card p-2 shadow-card">
              <AccountRow to="/admin" icon={Shield} label="پنل مدیریت" />
            </div>
          </section>
        ) : null}
      </div>
    </PageShell>
  );
}