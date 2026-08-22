import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/page-shell";
import {
  AddToCartButton,
  EmptyState,
  ErrorState,
  LoadingState,
  RatingBadge,
} from "@/components/catalog";
import { productQuery, supplierRatingsQuery } from "@/lib/catalog";
import { formatToman } from "@/lib/format";

export const Route = createFileRoute("/products/$productId")({
  head: () => ({
    meta: [
      { title: "جزئیات محصول و مقایسه تأمین‌کننده‌ها | تأمینک" },
      {
        name: "description",
        content: "قیمت، موجودی و امتیاز تأمین‌کننده‌های مختلف برای این محصول را مقایسه کنید.",
      },
      { property: "og:title", content: "مقایسه تأمین‌کننده‌ها | تأمینک" },
      {
        property: "og:description",
        content: "قیمت تأمین‌کننده‌های مختلف برای یک محصول را کنار هم ببینید.",
      },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { productId } = Route.useParams();
  const query = useQuery(productQuery(productId));

  const supplierIds = useMemo(
    () => (query.data?.supplier_products ?? []).map((o) => o.supplier_organization_id),
    [query.data],
  );
  const ratings = useQuery({
    ...supplierRatingsQuery(supplierIds),
    enabled: supplierIds.length > 0,
  });

  if (query.isPending) {
    return (
      <PageShell title="محصول">
        <LoadingState />
      </PageShell>
    );
  }
  if (query.isError) {
    return (
      <PageShell title="محصول">
        <ErrorState onRetry={() => query.refetch()} />
      </PageShell>
    );
  }
  const product = query.data;
  if (!product) {
    return (
      <PageShell title="محصول">
        <EmptyState label="محصولی پیدا نشد." />
      </PageShell>
    );
  }

  const offers = [...(product.supplier_products ?? [])].sort((a, b) => {
    if (a.is_available !== b.is_available) return a.is_available ? -1 : 1;
    return Number(a.unit_price) - Number(b.unit_price);
  });

  return (
    <PageShell title={product.name} description={product.brand ?? undefined}>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div className="aspect-[4/3] overflow-hidden rounded-xl border border-border bg-secondary/60">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center text-muted-foreground">
                <Package className="size-10" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {product.category ? <Badge variant="secondary">{product.category}</Badge> : null}
            {product.unit ? <Badge variant="outline">واحد: {product.unit}</Badge> : null}
            {product.brand ? <Badge variant="outline">برند: {product.brand}</Badge> : null}
          </div>
          {product.description ? (
            <p className="text-sm leading-7 text-muted-foreground">{product.description}</p>
          ) : null}
        </div>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-bold">مقایسه تأمین‌کننده‌ها</h2>
            <p className="text-sm text-muted-foreground">
              قیمت‌ها به تومان است. موجودها و ارزان‌ترین‌ها بالاتر نمایش داده می‌شوند.
            </p>
          </div>

          {offers.length === 0 ? (
            <EmptyState label="تأمین‌کننده‌ای در این محدوده پیدا نشد." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
              {offers.map((offer, index) => {
                const org = offer.organizations;
                const rating = ratings.data?.[offer.supplier_organization_id];
                return (
                  <div
                    key={offer.id}
                    className={`flex flex-wrap items-center gap-3 p-4 ${
                      index > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <div className="min-w-[10rem] flex-1">
                      {org ? (
                        <Link
                          to="/suppliers/$supplierId"
                          params={{ supplierId: org.id }}
                          className="font-semibold hover:text-primary"
                        >
                          {org.name}
                        </Link>
                      ) : (
                        <span className="font-semibold">تأمین‌کننده</span>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3.5" />
                          {[org?.city, org?.province].filter(Boolean).join("، ") || "—"}
                        </span>
                        <RatingBadge
                          rating={rating?.rating ?? null}
                          count={rating?.reviewCount ?? 0}
                        />
                      </div>
                    </div>
                    <div className="text-start">
                      <p className="text-lg font-bold text-primary">
                        {formatToman(Number(offer.unit_price))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {offer.is_available ? "موجود" : "ناموجود"}
                      </p>
                    </div>
                    <AddToCartButton offer={offer} />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
