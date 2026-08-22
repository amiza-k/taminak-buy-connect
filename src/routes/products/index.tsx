import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/page-shell";
import { LocationPicker } from "@/components/location-picker";
import { EmptyState, ErrorState, LoadingState, ProductCard } from "@/components/catalog";
import { matchesLocation, productsQuery, type ProductWithOffers } from "@/lib/catalog";
import { useMarketLocation } from "@/hooks/use-location";
import { formatNumber } from "@/lib/format";

type ProductSearch = { q?: string };

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>): ProductSearch =>
    typeof search['q'] === "string" && search['q'] ? { q: search['q'] } : {},
  head: () => ({
    meta: [
      { title: "محصولات | مقایسه قیمت تأمین‌کننده‌ها در تأمینک" },
      {
        name: "description",
        content:
          "جست‌وجوی مواد اولیه و ملزومات کافه و رستوران و مقایسه قیمت تأمین‌کننده‌های مختلف در تأمینک.",
      },
      { property: "og:title", content: "محصولات تأمینک" },
      {
        property: "og:description",
        content: "کمترین قیمت و تعداد تأمین‌کننده‌های موجود برای هر محصول.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
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
      navigate({ to: "/products", search: next ? { q: next } : {}, replace: true });
    }, 350);
    return () => clearTimeout(handle);
  }, [term, q, navigate]);

  const query = useQuery(productsQuery(q ?? ""));

  const products = useMemo<ProductWithOffers[]>(() => {
    const rows = query.data ?? [];
    if (location.scope === "country" || !location.province) return rows;
    return rows
      .map((product) => ({
        ...product,
        supplier_products: (product.supplier_products ?? []).filter((offer) =>
          matchesLocation(offer.organizations, location),
        ),
      }))
      .filter((product) => product.supplier_products.length > 0);
  }, [query.data, location]);

  return (
    <PageShell
      title={q ? `نتایج جستجو برای «${q}»` : "محصولات"}
      description="جست‌وجو، مقایسه قیمت و انتخاب تأمین‌کننده"
      actions={<LocationPicker />}
    >
      <div className="mb-6 flex items-center gap-2 rounded-xl border border-border bg-card p-2">
        <Search className="ms-2 size-4 shrink-0 text-muted-foreground" />
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="چه محصولی نیاز دارید؟"
          aria-label="جست‌وجوی محصول"
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
      </div>

      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : products.length === 0 ? (
        <EmptyState label="محصولی پیدا نشد." />
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {formatNumber(products.length)} محصول
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
