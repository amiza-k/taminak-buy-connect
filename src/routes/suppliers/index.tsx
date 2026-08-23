import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageShell } from "@/components/page-shell";
import { EmptyState, ErrorState, LoadingState, SupplierCard } from "@/components/catalog";
import { matchesLocation, suppliersQuery } from "@/lib/catalog";
import { useMarketLocation } from "@/hooks/use-location";

export const Route = createFileRoute("/suppliers/")({
  head: () => ({
    meta: [
      { title: "تأمین‌کننده‌های کافه و رستوران | تأمینک" },
      {
        name: "description",
        content: "فهرست تأمین‌کننده‌های مواد اولیه کافه و رستوران به همراه موقعیت و امتیاز خریداران.",
      },
      { property: "og:title", content: "تأمین‌کننده‌ها | تأمینک" },
      {
        property: "og:description",
        content: "تأمین‌کننده‌های مواد اولیه را بر اساس شهر و استان پیدا کنید.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SuppliersPage,
});

function SuppliersPage() {
  const location = useMarketLocation();
  const query = useQuery(suppliersQuery());

  const suppliers = useMemo(
    () => (query.data ?? []).filter((s) => matchesLocation(s, location)),
    [query.data, location],
  );

  return (
    <PageShell
      title="تأمین‌کننده‌ها"
      description="تأمین‌کننده‌های فعال در محدوده انتخابی شما."
    >
      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : suppliers.length === 0 ? (
        <EmptyState label="تأمین‌کننده‌ای در این محدوده پیدا نشد." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => (
            <SupplierCard key={supplier.id} supplier={supplier} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
