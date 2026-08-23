import { Link } from "@tanstack/react-router";
import { Loader2, MapPin, Package, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatToman, toFaDigits } from "@/lib/format";
import { lowestAvailablePrice, type Offer, type ProductWithOffers, type SupplierSummary } from "@/lib/catalog";
import { useAuth } from "@/hooks/use-auth";
import { useBuyerOrganization, useCartMutations } from "@/lib/cart";

export function LoadingState({ label = "در حال بارگذاری..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card p-10 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-10 text-center">
      <p className="text-sm text-destructive">بارگذاری اطلاعات با مشکل مواجه شد.</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          تلاش دوباره
        </Button>
      ) : null}
    </div>
  );
}

export function RatingBadge({
  rating,
  count,
  className,
}: {
  rating: number | null;
  count: number;
  className?: string;
}) {
  if (rating === null || count === 0) {
    return (
      <span className={`text-xs text-muted-foreground ${className ?? ""}`}>بدون امتیاز</span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${className ?? ""}`}>
      <Star className="size-3.5 fill-accent text-accent" />
      <span className="font-medium">{toFaDigits(rating.toFixed(1))}</span>
      <span className="text-muted-foreground">({formatNumber(count)} نظر)</span>
    </span>
  );
}

export function ProductCard({ product }: { product: ProductWithOffers }) {
  const offers = product.supplier_products ?? [];
  const available = offers.filter((o) => o.is_available);
  const lowest = lowestAvailablePrice(offers);

  return (
    <Link
      to="/products/$productId"
      params={{ productId: product.id }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-colors hover:border-primary/40"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-secondary/60">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <Package className="size-8" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {product.category ? (
            <Badge variant="secondary" className="text-[11px]">
              {product.category}
            </Badge>
          ) : null}
          {product.unit ? (
            <span className="text-xs text-muted-foreground">واحد: {product.unit}</span>
          ) : null}
        </div>
        <h3 className="text-base font-semibold group-hover:text-primary">{product.name}</h3>
        <div className="mt-auto space-y-1 pt-2">
          <p className="text-xs text-muted-foreground">
            {lowest === null ? "قیمتی ثبت نشده" : "کمترین قیمت"}
          </p>
          <p className="text-lg font-bold text-primary">
            {lowest === null ? "—" : formatToman(lowest)}
          </p>
          <p className="text-xs text-muted-foreground">
            {available.length > 0
              ? `${formatNumber(available.length)} تأمین‌کننده موجود`
              : "تأمین‌کننده موجودی ندارد"}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function SupplierCard({ supplier }: { supplier: SupplierSummary }) {
  return (
    <Link
      to="/suppliers/$supplierId"
      params={{ supplierId: supplier.id }}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold">{supplier.name}</h3>
        <RatingBadge rating={supplier.rating} count={supplier.reviewCount} />
      </div>
      <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <MapPin className="size-4" />
        {[supplier.city, supplier.province].filter(Boolean).join("، ") || "موقعیت ثبت نشده"}
      </p>
      {supplier.address ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">{supplier.address}</p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {formatNumber(supplier.offerCount)} محصول موجود
      </p>
    </Link>
  );
}

/**
 * Adds a specific supplier offer to the buyer organization's active cart
 * (carts / cart_items). Routes to login or onboarding when the buyer is not ready.
 */
export function AddToCartButton({
  offer,
  className,
}: {
  offer: Pick<Offer, "id" | "is_available">;
  className?: string;
}) {
  const { user, loading } = useAuth();
  const { organization, isPending } = useBuyerOrganization();
  const { addItem } = useCartMutations();

  if (!offer.is_available) {
    return (
      <Button size="sm" variant="outline" className={className} disabled>
        ناموجود
      </Button>
    );
  }

  if (!user) {
    return (
      <Button size="sm" className={className} asChild>
        <Link to="/login">افزودن به سبد</Link>
      </Button>
    );
  }

  if (!loading && !isPending && !organization) {
    return (
      <Button size="sm" className={className} asChild>
        <Link to="/onboarding">ثبت کسب‌وکار برای خرید</Link>
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      className={className}
      disabled={addItem.isPending || isPending}
      onClick={() =>
        addItem.mutate(
          { supplierProductId: offer.id, userId: user.id },
          {
            onSuccess: () => toast.success("به سبد خرید اضافه شد."),
            onError: () => toast.error("افزودن به سبد ناموفق بود."),
          },
        )
      }
    >
      افزودن به سبد
    </Button>
  );
}
