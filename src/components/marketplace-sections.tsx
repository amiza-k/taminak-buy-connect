import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Package, ShoppingCart, Store } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { RatingBadge, AddToCartButton } from "@/components/catalog";
import { formatToman } from "@/lib/format";
import { lowestAvailablePrice, type Offer, type ProductWithOffers } from "@/lib/catalog";
import type { SupplierOfferPreview, SupplierStorefront } from "@/lib/catalog";
import type { SupplierOfferMedia } from "@/lib/supplier-media";

export function HorizontalScroller({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  );
}

export function CategorySectionSkeleton() {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-40 shrink-0 rounded-xl sm:h-64 sm:w-48" />
        ))}
      </div>
    </section>
  );
}

/**
 * Canonical-product card. A product may have several supplier offers, so it
 * links to the product detail page (where the buyer picks one specific
 * offer) instead of adding anything to the cart directly.
 */
export function MarketplaceProductCard({ product }: { product: ProductWithOffers }) {
  const offers = product.supplier_products ?? [];
  const available = offers.filter((o) => o.is_available);
  const lowest = lowestAvailablePrice(offers);

  return (
    <Link
      to="/products/$productId"
      params={{ productId: product.id }}
      className="group flex w-40 shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-colors hover:border-primary/40 sm:w-48"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-secondary/60">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <Package className="size-8" />
          </div>
        )}
        <span className="absolute end-2 top-2 grid size-7 place-items-center rounded-full bg-card/90 text-primary shadow">
          <ShoppingCart className="size-3.5" />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold group-hover:text-primary">
          {product.name}
        </h3>
        <p className="text-sm font-bold text-primary">
          {lowest === null ? "—" : formatToman(lowest)}
        </p>
        <p className="text-xs text-muted-foreground">
          {available.length > 0 ? `از ${available.length} تأمین‌کننده` : "ناموجود"}
        </p>
      </div>
    </Link>
  );
}

/**
 * Offer card inside a supplier's own storefront section. Unlike
 * MarketplaceProductCard, the offer here belongs to exactly this supplier,
 * so it can be added to the cart directly.
 */
export function SupplierOfferCard({
  offer,
  media,
}: {
  offer: SupplierOfferPreview;
  media: SupplierOfferMedia[] | undefined;
}) {
  // Image priority: supplier offer media -> canonical product image -> placeholder.
  const image = media?.find((m) => m.media_type === "image")?.url ?? offer.product.image_url;
  const cartOffer: Pick<Offer, "id" | "is_available"> = { id: offer.id, is_available: true };

  return (
    <div className="flex w-40 shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card sm:w-48">
      <Link to="/products/$productId" params={{ productId: offer.product.id }}>
        <div className="aspect-square w-full overflow-hidden bg-secondary/60">
          {image ? (
            <img
              src={image}
              alt={offer.product.name}
              loading="lazy"
              className="size-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="grid size-full place-items-center text-muted-foreground">
              <Package className="size-8" />
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link to="/products/$productId" params={{ productId: offer.product.id }}>
          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold hover:text-primary">
            {offer.product.name}
          </h3>
        </Link>
        <p className="text-sm font-bold text-primary">{formatToman(offer.unit_price)}</p>
        <AddToCartButton offer={cartOffer} className="mt-1 w-full" />
      </div>
    </div>
  );
}

export function CategoryProductSection({
  category,
  products,
}: {
  category: { id: string; name: string; slug: string };
  products: ProductWithOffers[];
}) {
  if (products.length === 0) return null;
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold sm:text-xl">{category.name}</h2>
        <Link
          to="/products"
          search={{ category: category.id }}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          مشاهده همه
          <ChevronLeft className="size-4" />
        </Link>
      </div>
      <HorizontalScroller>
        {products.map((product) => (
          <MarketplaceProductCard key={product.id} product={product} />
        ))}
      </HorizontalScroller>
    </section>
  );
}

export function SupplierStoreSection({
  storefront,
  mediaMap,
}: {
  storefront: SupplierStorefront;
  mediaMap: Record<string, SupplierOfferMedia[]>;
}) {
  if (storefront.offers.length === 0) return null;
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold sm:text-xl">
            <Store className="size-5 text-primary" />
            {storefront.name}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <RatingBadge rating={storefront.rating} count={storefront.reviewCount} />
            {storefront.city ? (
              <span className="text-xs text-muted-foreground">
                {[storefront.city, storefront.province].filter(Boolean).join("، ")}
              </span>
            ) : null}
          </div>
        </div>
        <Link
          to="/suppliers/$supplierId"
          params={{ supplierId: storefront.id }}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          مشاهده فروشگاه
          <ChevronLeft className="size-4" />
        </Link>
      </div>
      <HorizontalScroller>
        {storefront.offers.map((offer) => (
          <SupplierOfferCard key={offer.id} offer={offer} media={mediaMap[offer.id]} />
        ))}
      </HorizontalScroller>
    </section>
  );
}