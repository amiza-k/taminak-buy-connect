import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageShell } from "@/components/page-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/catalog";
import { useBuyerOrganization, useCart, cartTotals, groupBySupplier } from "@/lib/cart";
import { useCheckout, type CheckoutResult } from "@/lib/checkout";
import { formatNumber, formatToman } from "@/lib/format";

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
  const cart = useCart();
  const checkout = useCheckout();

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<CheckoutResult[] | null>(null);

  const items = cart.data?.items ?? [];
  const groups = useMemo(() => groupBySupplier(items), [items]);
  const totals = cartTotals(items);

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

  if (orgPending || cart.isPending) {
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
    if (!deliveryAddress.trim() || !contactPhone.trim()) {
      toast.error("آدرس و شماره تماس الزامی است.");
      return;
    }
    checkout.mutate(
      {
        cartId,
        organizationId: organization.id,
        deliveryAddress: deliveryAddress.trim(),
        contactPhone: contactPhone.trim(),
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
            <div className="space-y-2">
              <Label htmlFor="delivery-address">آدرس دریافت سفارش</Label>
              <Textarea
                id="delivery-address"
                required
                rows={3}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">شماره تماس</Label>
              <Input
                id="contact-phone"
                dir="ltr"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
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
          <Button type="submit" form="checkout-form" className="w-full" disabled={checkout.isPending}>
            {checkout.isPending ? "در حال ثبت سفارش…" : "ثبت نهایی سفارش"}
          </Button>
        </aside>
      </div>
    </PageShell>
  );
}