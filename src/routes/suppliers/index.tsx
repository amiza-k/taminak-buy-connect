import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/page-shell";
import { LocationPicker } from "@/components/location-picker";
import { EmptyState, ErrorState } from "@/components/catalog";
import { CategorySectionSkeleton, SupplierStoreSection } from "@/components/marketplace-sections";
import { matchesLocation, supplierStorefrontsQuery } from "@/lib/catalog";
import { offerMediaBulkQuery } from "@/lib/supplier-media";
import { useMarketLocation } from "@/hooks/use-location";

type SupplierSearch = { q?: string };

export const Route = createFileRoute("/suppliers/")({
  validateSearch: (search: Record<string, unknown>): SupplierSearch =>
    typeof search['q'] === "string" && search['q'] ? { q: search['q'] } : {},
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
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const location = useMarketLocation();
  const [term, setTerm] = useState(q ?? "");

  useEffect(() => {
    setTerm(q ?? "");
  }, [q]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = term.trim();
      if (next === (q ?? "")) return;
      navigate({ to: "/suppliers", search: next ? { q: next } : {}, replace: true });
    }, 350);
    return () => clearTimeout(handle);
  }, [term, q, navigate]);

  const query = useQuery(supplierStorefrontsQuery());

  const storefronts = useMemo(() => {
    let rows = query.data ?? [];
    rows = rows.filter((s) => matchesLocation(s, location));
    const term = (q ?? "").trim();
    if (term) {
      rows = rows.filter((s) => s.name.includes(term));
    }
    return rows;
  }, [query.data, location, q]);

  const allOfferIds = useMemo(
    () => storefronts.flatMap((s) => s.offers.map((o) => o.id)),
    [storefronts],
  );
  const mediaQuery = useQuery({
    ...offerMediaBulkQuery(allOfferIds),
    enabled: allOfferIds.length > 0,
  });

  return (
    <PageShell
      title="تأمین‌کننده‌ها"
      description="تأمین‌کننده‌های فعال در محدوده انتخابی شما"
      actions={<LocationPicker />}
    >
      <div className="mb-6 flex items-center gap-2 rounded-xl border border-border bg-card p-2">
        <Search className="ms-2 size-4 shrink-0 text-muted-foreground" />
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="جست‌وجوی نام فروشگاه یا تأمین‌کننده"
          aria-label="جست‌وجوی تأمین‌کننده"
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
      </div>

      {query.isPending ? (
        <div className="space-y-10">
          <CategorySectionSkeleton />
          <CategorySectionSkeleton />
        </div>
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : storefronts.length === 0 ? (
        <EmptyState
          label={q ? "تأمین‌کننده‌ای با این نام پیدا نشد." : "تأمین‌کننده‌ای در این محدوده پیدا نشد."}
        />
      ) : (
        <div className="space-y-10">
          {storefronts.map((storefront) => (
            <SupplierStoreSection
              key={storefront.id}
              storefront={storefront}
              mediaMap={mediaQuery.data ?? {}}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
