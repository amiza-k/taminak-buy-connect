import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { History, ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/catalog";
import {
  useSupplierMembership,
  supplierOffersQuery,
  useUpdateSupplierOffer,
  useAdjustSupplierStock,
  stockMovementsQuery,
  type SupplierOffer,
} from "@/lib/supplier";
import { offerMediaQuery, useUploadOfferMedia, useDeleteOfferMedia } from "@/lib/supplier-media";
import { formatDate, formatNumber, formatToman } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/supplier/products/")({
  head: () => ({ meta: [{ title: "محصولات فروشنده | تأمینک" }] }),
  component: SupplierProductsPage,
});

const MOVEMENT_LABELS: Record<string, string> = {
  adjustment: "شارژ دستی",
  sale: "کسر بابت سفارش",
};

function StockDialog({ offer, orgId }: { offer: SupplierOffer; orgId: string | null }) {
  const [open, setOpen] = useState(false);
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const adjust = useAdjustSupplierStock(orgId);
  const movements = useQuery({ ...stockMovementsQuery(offer.id), enabled: open });

  function handleAdjust(sign: 1 | -1) {
    const value = Number(delta);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("مقدار نامعتبر است");
      return;
    }
    adjust.mutate(
      {
        supplierProductId: offer.id,
        delta: sign * value,
        ...(note.trim() ? { note: note.trim() } : {}),
      },
      {
        onSuccess: () => {
          toast.success("موجودی به‌روزرسانی شد");
          setDelta("");
          setNote("");
        },
        onError: (error: Error) =>
          toast.error(
            error.message.includes("negative")
              ? "موجودی کافی نیست"
              : "به‌روزرسانی موجودی ناموفق بود",
          ),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <History className="size-4" />
          موجودی: {formatNumber(offer.stock_quantity)}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>موجودی — {offer.product?.name ?? "محصول"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm">
            موجودی فعلی:{" "}
            <span className="font-bold text-primary">{formatNumber(offer.stock_quantity)}</span>
          </p>
          <div className="flex items-center gap-2">
            <Input
              dir="ltr"
              type="number"
              min={0}
              placeholder="مقدار"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              className="w-28"
            />
            <Input
              placeholder="یادداشت (اختیاری)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={adjust.isPending} onClick={() => handleAdjust(1)}>
              افزایش موجودی
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={adjust.isPending}
              onClick={() => handleAdjust(-1)}
            >
              اصلاح (کاهش)
            </Button>
          </div>

          <div className="border-t border-border pt-3">
            <p className="mb-2 text-sm font-semibold">تاریخچهٔ موجودی</p>
            {movements.isPending ? (
              <LoadingState label="در حال بارگذاری…" />
            ) : (movements.data ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">هنوز تغییری ثبت نشده است.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {(movements.data ?? []).map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-secondary/40 p-2"
                  >
                    <div>
                      <p>
                        <span className={m.delta >= 0 ? "text-success" : "text-destructive"}>
                          {m.delta >= 0 ? "+" : ""}
                          {formatNumber(m.delta)}
                        </span>{" "}
                        {MOVEMENT_LABELS[m.movement_type] ?? m.movement_type}
                        {m.note ? ` — ${m.note}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(m.created_at)} — موجودی پس از تغییر:{" "}
                        {formatNumber(m.resulting_stock)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MediaDialog({ offer, orgId }: { offer: SupplierOffer; orgId: string | null }) {
  const [open, setOpen] = useState(false);
  const media = useQuery({ ...offerMediaQuery(offer.id), enabled: open });
  const upload = useUploadOfferMedia(offer.id);
  const remove = useDeleteOfferMedia(offer.id);

  function handleFile(event: React.ChangeEvent<HTMLInputElement>, mediaType: "image" | "video") {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !orgId) return;
    upload.mutate(
      { file, supplierOrganizationId: orgId, mediaType, sortOrder: media.data?.length ?? 0 },
      {
        onSuccess: () => toast.success("رسانه اضافه شد"),
        onError: () => toast.error("آپلود ناموفق بود"),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ImagePlus className="size-4" />
          رسانه
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>عکس و ویدیوی — {offer.product?.name ?? "محصول"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer">
              <span className="inline-flex h-9 items-center rounded-md border border-input px-3 text-sm">
                افزودن عکس
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e, "image")}
              />
            </label>
            <label className="cursor-pointer">
              <span className="inline-flex h-9 items-center rounded-md border border-input px-3 text-sm">
                افزودن ویدیو
              </span>
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleFile(e, "video")}
              />
            </label>
          </div>

          {media.isPending ? (
            <LoadingState label="در حال بارگذاری…" />
          ) : (media.data ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">هنوز رسانه‌ای اضافه نکرده‌اید.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {(media.data ?? []).map((m) => (
                <div
                  key={m.id}
                  className="group relative overflow-hidden rounded-lg border border-border"
                >
                  {m.media_type === "image" ? (
                    <img src={m.url} alt="" className="aspect-square w-full object-cover" />
                  ) : (
                    <video src={m.url} className="aspect-square w-full object-cover" muted />
                  )}
                  <button
                    type="button"
                    disabled={remove.isPending}
                    onClick={() =>
                      remove.mutate(
                        { id: m.id, storage_path: m.storage_path },
                        {
                          onSuccess: () => toast.success("رسانه حذف شد"),
                          onError: () => toast.error("حذف ناموفق بود"),
                        },
                      )
                    }
                    className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/60 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="size-3" />
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OfferRow({
  offer,
  orgId,
  mutation,
}: {
  offer: SupplierOffer;
  orgId: string | null;
  mutation: ReturnType<typeof useUpdateSupplierOffer>;
}) {
  const [price, setPrice] = useState(String(offer.unit_price));

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border p-4 first:border-t-0">
      <div className="min-w-[10rem] flex-1">
        <p className="font-semibold">{offer.product?.name ?? "محصول"}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {offer.product?.unit ? `واحد: ${offer.product.unit}` : ""}
          {offer.product?.category ? ` — ${offer.product.category}` : ""}
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
      <StockDialog offer={offer} orgId={orgId} />
      <MediaDialog offer={offer} orgId={orgId} />
      {offer.stock_quantity <= 0 ? (
        <Badge variant="destructive" className="text-[11px]">
          موجودی صفر
        </Badge>
      ) : null}
      <p className="w-28 text-start text-sm text-muted-foreground">
        {formatToman(offer.unit_price)}
      </p>
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
          <Link to="/supplier/products/new">افزودن محصول</Link>
        </Button>
      </div>
      {offers.length === 0 ? (
        <EmptyState label="هنوز محصولی ثبت نکرده‌اید." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          {offers.map((offer) => (
            <OfferRow key={offer.id} offer={offer} orgId={orgId} mutation={mutation} />
          ))}
        </div>
      )}
    </div>
  );
}
