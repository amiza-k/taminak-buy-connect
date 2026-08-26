import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDate, formatNumber, formatToman } from "@/lib/format";
import type { OrderItemRow } from "@/lib/orders";

export function PrintInvoiceButton() {
  return (
    <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
      <Printer className="size-4" />
      چاپ فاکتور
    </Button>
  );
}

/**
 * Print-only invoice layout. Hidden on screen (`hidden print:block`) so it
 * never clutters the normal page but renders cleanly when the user prints —
 * built from the same order/order_items snapshot as the screen view, never
 * from current supplier_products pricing.
 */
export function InvoiceSheet({
  orderId,
  counterpartyLabel,
  counterpartyName,
  createdAt,
  items,
  subtotal,
  total,
  deliveryAddress,
  contactPhone,
  note,
}: {
  orderId: string;
  counterpartyLabel: string;
  counterpartyName: string;
  createdAt: string;
  items: OrderItemRow[];
  subtotal: number;
  total: number;
  deliveryAddress: string | null;
  contactPhone: string | null;
  note: string | null;
}) {
  return (
    <div className="hidden print:block" dir="rtl">
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="text-lg font-bold">تأمینک</p>
          <p className="text-xs text-muted-foreground">فاکتور فروش داخلی</p>
        </div>
        <div className="text-left text-xs">
          <p>شماره سفارش: {orderId}</p>
          <p>تاریخ: {formatDate(createdAt)}</p>
        </div>
      </div>

      <p className="mb-4 text-sm">
        {counterpartyLabel}: <span className="font-semibold">{counterpartyName}</span>
      </p>

      <table className="mb-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-start">
            <th className="py-2 text-start">کالا</th>
            <th className="py-2 text-start">تعداد</th>
            <th className="py-2 text-start">قیمت واحد</th>
            <th className="py-2 text-start">جمع</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border">
              <td className="py-2">{item.product_name}</td>
              <td className="py-2">{formatNumber(item.quantity)}</td>
              <td className="py-2">{formatToman(item.unit_price)}</td>
              <td className="py-2">{formatToman(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ms-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <span>جمع کالاها:</span>
          <span>{formatToman(subtotal)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>مبلغ کل:</span>
          <span>{formatToman(total)}</span>
        </div>
      </div>

      {deliveryAddress || contactPhone || note ? (
        <div className="mt-6 space-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
          {deliveryAddress ? <p>آدرس تحویل: {deliveryAddress}</p> : null}
          {contactPhone ? <p dir="ltr">تلفن تماس: {contactPhone}</p> : null}
          {note ? <p>توضیحات: {note}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
