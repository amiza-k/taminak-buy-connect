import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Package } from "lucide-react";

import { PageShell } from "@/components/page-shell";
import {
  AddToCartButton,
  EmptyState,
  ErrorState,
  LoadingState,
  RatingBadge,
} from "@/components/catalog";
import { supplierQuery } from "@/lib/catalog";
import { formatDate, formatToman } from "@/lib/format";

export const Route = createFileRoute("/suppliers/$supplierId")({
  head: () => ({
    meta: [
      { title: "پروفایل تأمین‌کننده | تأمینک" },
      {
        name: "description",
        content: "محصولات، قیمت‌ها، امتیاز و نظرهای خریداران این تأمین‌کننده را ببینید.",
      },
      { property: "og:title", content: "پروفایل تأمین‌کننده | تأمینک" },
      {
        property: "og:description",
        content: "فهرست محصولات و امتیاز خریداران برای این تأمین‌کننده.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SupplierProfilePage,
});

function SupplierProfilePage() {
  const { supplierId } = Route.useParams();
  const query = useQuery(supplierQuery(supplierId));

  if (query.isPending) {
    return (
      <PageShell title="تأمین‌کننده">
        <LoadingState />
      </PageShell>
    );
  }
  if (query.isError) {
    return (
      <PageShell title="تأمین‌کننده">
        <ErrorState onRetry={() => query.refetch()} />
      </PageShell>
    );
  }
  const supplier = query.data;
  if (!supplier) {
    return (
      <PageShell title="تأمین‌کننده">
        <EmptyState label="تأمین‌کننده‌ای پیدا نشد." />
      </PageShell>
    );
  }

  const offers = [...supplier.offers].sort((a, b) => {
    if (a.is_available !== b.is_available) return a.is_available ? -1 : 1;
    return Number(a.unit_price) - Number(b.unit_price);
  });

  return (
    <PageShell
      title={supplier.name}
      description={[supplier.city, supplier.province].filter(Boolean).join("، ") || undefined}
    >
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-card">
          <RatingBadge rating={supplier.rating} count={supplier.reviewCount} />
          <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {[supplier.city, supplier.province].filter(Boolean).join("، ") || "موقعیت ثبت نشده"}
          </p>
          {supplier.address ? (
            <p className="text-sm leading-7 text-muted-foreground">{supplier.address}</p>
          ) : null}
        </aside>

        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-lg font-bold">محصولات این تأمین‌کننده</h2>
            {offers.length === 0 ? (
              <EmptyState label="محصولی ثبت نشده است." />
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
                {offers.map((offer, index) => (
                  <div
                    key={offer.id}
                    className={`flex flex-wrap items-center gap-3 p-4 ${
                      index > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <div className="min-w-[10rem] flex-1">
                      {offer.products ? (
                        <Link
                          to="/products/$productId"
                          params={{ productId: offer.products.id }}
                          className="font-semibold hover:text-primary"
                        >
                          {offer.products.name}
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-2 font-semibold">
                          <Package className="size-4" />
                          محصول
                        </span>
                      )}
                      {offer.products?.unit ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          واحد: {offer.products.unit}
                        </p>
                      ) : null}
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
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold">نظر خریداران</h2>
            {supplier.reviews.length === 0 ? (
              <EmptyState label="هنوز نظری ثبت نشده است." />
            ) : (
              <ul className="space-y-3">
                {supplier.reviews.map((review) => (
                  <li
                    key={review.id}
                    className="rounded-xl border border-border bg-card p-4 shadow-card"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <RatingBadge rating={review.rating} count={1} />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                    {review.comment ? (
                      <p className="mt-2 text-sm leading-7">{review.comment}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </PageShell>
  );
}
