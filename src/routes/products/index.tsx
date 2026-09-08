import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/page-shell";
import { LocationPicker } from "@/components/location-picker";
import { EmptyState, ErrorState, LoadingState, ProductCard } from "@/components/catalog";
import { CategoryProductSection, CategorySectionSkeleton } from "@/components/marketplace-sections";
import {
  matchesLocation,
  productsQuery,
  groupProductsByCategory,
  type ProductWithOffers,
} from "@/lib/catalog";
import { categoriesQuery } from "@/lib/categories";
import { useMarketLocation } from "@/hooks/use-location";
import { formatNumber } from "@/lib/format";

type ProductSearch = { q?: string; category?: string };

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>): ProductSearch => ({
    ...(typeof search["q"] === "string" && search["q"] ? { q: search["q"] } : {}),
    ...(typeof search["category"] === "string" && search["category"]
      ? { category: search["category"] }
      : {}),
  }),
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
  const { q, category } = Route.useSearch();
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
  const categoriesResult = useQuery(categoriesQuery());

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

  const activeCategory = useMemo(
    () =>
      category ? ((categoriesResult.data ?? []).find((c) => c.id === category) ?? null) : null,
    [category, categoriesResult.data],
  );

  const groups = useMemo(
    () => groupProductsByCategory(products, categoriesResult.data ?? []),
    [products, categoriesResult.data],
  );

  const showFlatGrid = Boolean(q) || Boolean(category);
  const flatProducts = category ? products.filter((p) => p.category_id === category) : products;

  return (
    <PageShell
      title={activeCategory ? activeCategory.name : q ? `نتایج جستجو برای «${q}»` : "محصولات"}
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

      {activeCategory ? (
        <Link to="/products" className="mb-4 inline-block text-sm text-primary hover:underline">
          ← بازگشت به همهٔ دسته‌بندی‌ها
        </Link>
      ) : null}

      {query.isPending || categoriesResult.isPending ? (
        showFlatGrid ? (
          <LoadingState />
        ) : (
          <div className="space-y-10">
            <CategorySectionSkeleton />
            <CategorySectionSkeleton />
          </div>
        )
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : showFlatGrid ? (
        flatProducts.length === 0 ? (
          <EmptyState label="محصولی پیدا نشد." />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {formatNumber(flatProducts.length)} محصول
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {flatProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )
      ) : groups.length === 0 ? (
        <EmptyState label="محصولی پیدا نشد." />
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <CategoryProductSection
              key={group.category.id}
              category={group.category}
              products={group.products}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
