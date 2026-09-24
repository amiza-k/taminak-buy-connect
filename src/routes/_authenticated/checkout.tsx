import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PageShell } from "@/components/page-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/catalog";
import { useBuyerOrganization, useCart, cartTotals, groupBySupplier } from "@/lib/cart";
import { useCheckout, type CheckoutResult } from "@/lib/checkout";
import { formatNumber, formatToman } from "@/lib/format";
import { useMyMemberships } from "@/hooks/use-organizations";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "ثبت سفارش | تأمینک" },
      { name: "description", content: "بررسی نهایی سبد خرید و ثبت سفارش برای هر تأمین‌کننده." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { organization, isPending: orgPending } = useBuyerOrganization();
  const memberships = useMyMemberships();
  const cart = useCart();
  const checkout = useCheckout();

  const [note, setNote] = useState("");
  const [deliveryOrganizationId, setDeliveryOrganizationId] = useState("");
  const [result, setResult] = useState<CheckoutResult[] | null>(null);

  const items = useMemo(() => cart.data?.items ?? [], [cart.data?.items]);
  const groups = useMemo(() => groupBySupplier(items), [items]);
  const totals = cartTotals(items);
  const deliveryLocations = useMemo(
    () =>
      (memberships.data ?? [])
        .map((membership) => membership.organizations)
        .filter(
          (location): location is NonNullable<typeof location> => location?.type !== "supplier",
        ),
    [memberships.data],
  );
  const selectedLocation = deliveryLocations.find(
    (location) => location.id === deliveryOrganizationId,
  );
  const isSelectedLocationReady = Boolean(
    selectedLocation?.phone_verified && selectedLocation.address && selectedLocation.phone,
  );

  if (result) {
    return (
      <PageShell title="سفارش ثبت شد" description="سفارش شما برای هر تأمین‌کننده جداگانه ثبت شد">
        <div className="space-y-4 pb-24 md:pb-0">
          <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-4">
            <CheckCircle2 className="size-5 text-success" />
            <p className="text-sm">سفارش شما ثبت شد.</p>
          </div>
          <div className="space-y-3">
            {result.map((order) => {
              const group = groups.find((g) => g.supplierId === order.supplierOrganizationId);
              return (
                <div
                  key={order.orderId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-card"
                >
                  <div>
                    <p className="font-semibold">{group?.supplierName ?? "تأمین‌کننده"}</p>
                    <p className="text-xs text-muted-foreground">وضعیت: در انتظار تأیید</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-primary">{formatToman(order.total)}</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/orders/$orderId" params={{ orderId: order.orderId }}>
                        مشاهده سفارش
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <Button asChild className="w-full">
            <Link to="/orders">مشاهده همهٔ سفارش‌ها</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  if (orgPending || memberships.isPending || cart.isPending) {
    return (
      <PageShell title="ثبت سفارش">
        <LoadingState />
      </PageShell>
    );
  }

  if (!organization) {
    return (
      <PageShell title="ثبت سفارش">
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            برای ثبت سفارش ابتدا کسب‌وکار خود را ثبت کنید.
          </p>
          <Button className="mt-4" asChild>
            <Link to="/onboarding">ثبت کسب‌وکار</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  if (cart.isError) {
    return (
      <PageShell title="ثبت سفارش">
        <ErrorState onRetry={() => cart.refetch()} />
      </PageShell>
    );
  }

  if (items.length === 0) {
    return (
      <PageShell title="ثبت سفارش">
        <EmptyState label="سبد خرید شما خالی است." />
      </PageShell>
    );
  }

  const cartId = cart.data?.cartId;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!cartId || !organization) return;
    if (!deliveryOrganizationId) {
      toast.error("لطفاً لوکیشن دریافت سفارش را انتخاب کنید.");
      return;
    }
    if (!isSelectedLocationReady) {
      toast.error("لوکیشن انتخاب‌شده باید تلفن تأییدشده و آدرس کامل داشته باشد.");
      return;
    }
    checkout.mutate(
      {
        cartId,
        organizationId: organization.id,
        deliveryOrganizationId,
        ...(note.trim() ? { note: note.trim() } : {}),
      },
      {
        onSuccess: (data) => setResult(data),
        onError: (error: Error) => {
          const message =
            error.message === "Cart is empty"
              ? "سبد خرید شما خالی است."
              : error.message === "One or more cart items are no longer available"
                ? "یکی از محصولات سبد خرید دیگر موجود نیست. لطفاً سبد خرید را بررسی کنید."
                : "ثبت سفارش انجام نشد. لطفاً دوباره تلاش کنید.";
          toast.error(message);
        },
      },
    );
  }

  return (
    <PageShell title="ثبت سفارش" description="بررسی نهایی سبد خرید و ثبت سفارش برای هر تأمین‌کننده">
      <div className="grid gap-6 pb-24 md:pb-0 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {groups.map((group) => (
            <section
              key={group.supplierId}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-card"
            >
              <header className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-3">
                <p className="text-sm font-semibold">{group.supplierName}</p>
                <p className="text-sm font-bold text-primary">{formatToman(group.subtotal)}</p>
              </header>
              <ul>
                {group.items.map((item) => {
                  const offer = item.supplier_products;
                  const product = offer?.products;
                  return (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 border-t border-border p-4 text-sm first:border-t-0"
                    >
                      <span>{product?.name ?? "محصول"}</span>
                      <span className="text-muted-foreground">
                        {formatNumber(Number(item.quantity))} ×{" "}
                        {formatToman(Number(offer?.unit_price ?? 0))}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          <form
            id="checkout-form"
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <fieldset className="space-y-3">
              <div className="mb-2 flex items-center justify-between">
                <legend className="font-medium">لوکیشن دریافت سفارش</legend>
                <span className="text-xs text-muted-foreground">یک لوکیشن را انتخاب کنید</span>
              </div>
              <RadioGroup
                value={deliveryOrganizationId}
                onValueChange={setDeliveryOrganizationId}
                aria-label="لوکیشن دریافت سفارش"
              >
                {deliveryLocations.map((location) => {
                  const ready = location.phone_verified && location.address && location.phone;
                  return (
                    <label
                      key={location.id}
                      htmlFor={`delivery-location-${location.id}`}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-secondary/30 p-4 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                    >
                      <RadioGroupItem
                        id={`delivery-location-${location.id}`}
                        value={location.id}
                        className="mt-1 shrink-0"
                        disabled={!ready}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{location.name}</span>
                          <Badge variant={ready ? "secondary" : "destructive"}>
                            {ready ? "تأیید شده" : "نیازمند تکمیل یا تأیید"}
                          </Badge>
                        </span>
                        <span className="mt-1 block text-muted-foreground">
                          {location.address ?? "آدرس ثبت نشده"}
                        </span>
                        <span className="mt-1 block text-muted-foreground" dir="ltr">
                          {location.phone ?? "تلفن ثبت نشده"}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </RadioGroup>
              {deliveryLocations.length === 0 && (
                <p className="text-destructive">
                  برای ثبت سفارش ابتدا یک لوکیشن کسب‌وکار ثبت کنید.
                </p>
              )}
              {!selectedLocation && deliveryLocations.length > 0 && (
                <p className="text-muted-foreground">
                  لوکیشن دریافت را پیش از ثبت سفارش انتخاب کنید.
                </p>
              )}
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor="note">توضیحات سفارش (اختیاری)</Label>
              <Textarea
                id="note"
                rows={2}
                placeholder="مثلاً: لطفاً سفارش صبح تحویل شود."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </form>
        </div>

        <aside className="h-fit space-y-3 rounded-xl border border-border bg-card p-5 shadow-card lg:sticky lg:top-20">
          <h2 className="text-base font-semibold">خلاصهٔ سفارش</h2>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{formatNumber(totals.supplierCount)} تأمین‌کننده</p>
            <p>{formatNumber(totals.itemCount)} قلم کالا</p>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
            <span>جمع کل:</span>
            <span className="text-lg font-bold text-primary">{formatToman(totals.subtotal)}</span>
          </div>
          <Button
            type="submit"
            form="checkout-form"
            className="w-full"
            disabled={checkout.isPending || !deliveryOrganizationId || !isSelectedLocationReady}
          >
            {checkout.isPending ? "در حال ثبت سفارش…" : "ثبت نهایی سفارش"}
          </Button>
        </aside>
      </div>
    </PageShell>
  );
}

function getCheckoutErrorMessage(error: Error): string {
  const messages: Record<string, string> = {
    "Authentication required": "برای ثبت سفارش، دوباره وارد حساب کاربری خود شوید.",
    "Cart not found": "سبد خرید پیدا نشد. لطفاً صفحه را تازه‌سازی کنید.",
    "Cart is not active": "این سبد قبلاً ثبت شده است. لطفاً به سفارش‌ها مراجعه کنید.",
    "Cart is empty": "سبد خرید شما خالی است.",
    "Not authorized for this cart": "شما به این سبد خرید دسترسی ندارید.",
    "One or more cart items are no longer available":
      "یکی از محصولات سبد خرید دیگر موجود نیست. لطفاً سبد خرید را بررسی کنید.",
    "Delivery address is required": "آدرس دریافت سفارش را تکمیل کنید.",
    "Contact phone is required": "شماره تلفن دریافت سفارش را تکمیل کنید.",
    "Organization phone and address must be verified before checkout":
      "تلفن و آدرس کسب‌وکار را تکمیل و تأیید کنید.",
    "Organization contact and address must be verified before checkout":
      "تلفن و آدرس کسب‌وکار را تکمیل و تأیید کنید.",
    "stack depth limit exceeded": "خطای ثبت سفارش برطرف شد؛ لطفاً دوباره تلاش کنید.",
  };

  return messages[error.message] ?? `ثبت سفارش انجام نشد: ${error.message || "خطای نامشخص"}`;
}
