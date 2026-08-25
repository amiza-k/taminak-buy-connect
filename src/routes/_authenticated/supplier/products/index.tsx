import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { EmptyState, ErrorState, LoadingState } from "@/components/catalog";
import {
  useSupplierMembership,
  supplierOffersQuery,
  useUpdateSupplierOffer,
  type SupplierOffer,
} from "@/lib/supplier";
import { formatToman } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/supplier/products/")({
  head: () => ({ meta: [{ title: "محصولات فروشنده | تأمینک" }] }),
  component: SupplierProductsPage,
});

function OfferRow({
  offer,
  mutation,
}: {
  offer: SupplierOffer;
  mutation: ReturnType<typeof useUpdateSupplierOffer>;
}) {
  const [price, setPrice] = useState(String(offer.unit_price));

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border p-4 first:border-t-0">
      <div className="min-w-[10rem] flex-1">
        <p className="font-semibold">{offer.product?.name ?? "محصول"}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {offer.product?.unit ? `واحد: ${offer.product.unit}` : ""}
          {offer.sku ? ` — SKU: ${offer.sku}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Input
          dir="ltr"
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-32"
        />
        <Button
          size="sm"
          variant="outline"
          disabled={mutation.isPending}
          onClick={() => {
            const value = Number(price);
            if (!Number.isFinite(value) || value < 0) {
              toast.error("قیمت نامعتبر است");
              return;
            }
            mutation.mutate(
              { offerId: offer.id, unit_price: value },
              {
                onSuccess: () => toast.success("قیمت به‌روزرسانی شد"),
                onError: () => toast.error("ذخیره قیمت ناموفق بود"),
              },
            );
          }}
        >
          ذخیره قیمت
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={offer.is_available}
          disabled={mutation.isPending}
          onCheckedChange={(checked) =>
            mutation.mutate(
              { offerId: offer.id, is_available: checked },
              {
                onSuccess: () => toast.success(checked ? "محصول موجود شد" : "محصول ناموجود شد"),
                onError: () => toast.error("تغییر موجودی ناموفق بود"),
              },
            )
          }
        />
        <span className="text-sm text-muted-foreground">
          {offer.is_available ? "موجود" : "ناموجود"}
        </span>
      </div>
      <p className="w-28 text-start text-sm text-muted-foreground">{formatToman(offer.unit_price)}</p>
    </div>
  );
}

function SupplierProductsPage() {
  const { organization } = useSupplierMembership();
  const orgId = organization?.id ?? null;
  const query = useQuery({ ...supplierOffersQuery(orgId), enabled: Boolean(orgId) });
  const mutation = useUpdateSupplierOffer(orgId);

  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  const offers = query.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          همه محصولات شما، شامل مواردی که ناموجود کرده‌اید.
        </p>
        <Button asChild size="sm">
          <Link to="/supplier/products/new">درخواست محصول جدید</Link>
        </Button>
      </div>
      {offers.length === 0 ? (
        <EmptyState label="هنوز محصولی ثبت نکرده‌اید." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          {offers.map((offer) => (
            <OfferRow key={offer.id} offer={offer} mutation={mutation} />
          ))}
        </div>
      )}
    </div>
  );
}