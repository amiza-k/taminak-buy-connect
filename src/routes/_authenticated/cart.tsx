import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/page-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/catalog";
import { useBuyerOrganization, useCart, useCartMutations, cartTotals, groupBySupplier } from "@/lib/cart";
import { formatNumber, formatToman } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/cart")({
  head: () => ({
    meta: [
      { title: "سبد خرید | تأمینک" },
      { name: "description", content: "سبد خرید چند تأمین‌کننده‌ای کسب‌وکار شما." },
      { property: "og:title", content: "سبد خرید تأمینک" },
      { property: "og:description", content: "مدیریت اقلام سبد خرید بر اساس تأمین‌کننده." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { organization, isPending: orgPending } = useBuyerOrganization();
  const cart = useCart();
  const { setQuantity, removeItem } = useCartMutations();

  const items = cart.data?.items ?? [];
  const groups = groupBySupplier(items);
  const totals = cartTotals(items);
  const busy = setQuantity.isPending || removeItem.isPending;

  return (
    <PageShell title="سبد خرید" description="اقلام شما بر اساس تأمین‌کننده گروه‌بندی می‌شود">
      <div className="pb-24 md:pb-0">
        {orgPending ? (
          <LoadingState />
        ) : !organization ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              برای استفاده از سبد خرید ابتدا کسب‌وکار خود را ثبت کنید.
            </p>
            <Button className="mt-4" asChild>
              <Link to="/onboarding">ثبت کسب‌وکار</Link>
            </Button>
          </div>
        ) : cart.isPending ? (
          <LoadingState />
        ) : cart.isError ? (
          <ErrorState onRetry={() => cart.refetch()} />
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <ShoppingBag className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">سبد خرید شما خالی است.</p>
            <Button className="mt-5" asChild>
              <Link to="/products">مشاهده محصولات</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              {groups.map((group) => (
                <section
                  key={group.supplierId}
                  className="overflow-hidden rounded-xl border border-border bg-card shadow-card"
                >
                  <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/40 px-4 py-3">
                    <div>
                      <Link
                        to="/suppliers/$supplierId"
                        params={{ supplierId: group.supplierId }}
                        className="text-sm font-semibold hover:text-primary"
                      >
                        {group.supplierName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {[group.supplierCity, group.supplierProvince].filter(Boolean).join("، ") ||
                          "موقعیت ثبت نشده"}
                      </p>
                    </div>
                    <p className="text-sm">
                      جمع این فروشنده:{" "}
                      <span className="font-bold text-primary">{formatToman(group.subtotal)}</span>
                    </p>
                  </header>

                  <ul>
                    {group.items.map((item) => {
                      const offer = item.supplier_products;
                      const product = offer?.products;
                      const unitPrice = Number(offer?.unit_price ?? 0);
                      const quantity = Number(item.quantity);
                      return (
                        <li
                          key={item.id}
                          className="flex flex-wrap items-center gap-3 border-t border-border p-4 first:border-t-0"
                        >
                          <div className="min-w-[10rem] flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {product ? (
                                <Link
                                  to="/products/$productId"
                                  params={{ productId: product.id }}
                                  className="font-semibold hover:text-primary"
                                >
                                  {product.name}
                                </Link>
                              ) : (
                                <span className="font-semibold">محصول</span>
                              )}
                              {offer?.is_available ? null : (
                                <Badge variant="destructive" className="text-[11px]">
                                  ناموجود
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {product?.unit ? `واحد: ${product.unit} — ` : ""}
                              {formatNumber(quantity)} × {formatToman(unitPrice)}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 rounded-lg border border-border">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label="افزایش تعداد"
                              disabled={busy}
                              onClick={() =>
                                setQuantity.mutate({ itemId: item.id, quantity: quantity + 1 })
                              }
                            >
                              <Plus className="size-4" />
                            </Button>
                            <span className="min-w-8 text-center text-sm font-medium">
                              {formatNumber(quantity)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label="کاهش تعداد"
                              disabled={busy}
                              onClick={() =>
                                setQuantity.mutate({ itemId: item.id, quantity: quantity - 1 })
                              }
                            >
                              <Minus className="size-4" />
                            </Button>
                          </div>

                          <p className="min-w-28 text-start font-bold text-primary">
                            {formatToman(unitPrice * quantity)}
                          </p>

                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="حذف از سبد"
                            disabled={busy}
                            onClick={() => removeItem.mutate(item.id)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>

            <aside className="h-fit space-y-3 rounded-xl border border-border bg-card p-5 shadow-card lg:sticky lg:top-20">
              <h2 className="text-base font-semibold">خلاصه سبد</h2>
              <p className="text-sm text-muted-foreground">
                {formatNumber(totals.itemCount)} کالا از {formatNumber(totals.supplierCount)}{" "}
                تأمین‌کننده
              </p>
              <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                <span>جمع کالاها:</span>
                <span className="text-lg font-bold text-primary">
                  {formatToman(totals.subtotal)}
                </span>
              </div>
              <Button className="w-full" disabled>
                ثبت سفارش (به‌زودی)
              </Button>
              <p className="text-xs text-muted-foreground">
                ثبت سفارش برای هر تأمین‌کننده در مرحله بعد فعال می‌شود.
              </p>
            </aside>
          </div>
        )}
      </div>
    </PageShell>
  );
}
