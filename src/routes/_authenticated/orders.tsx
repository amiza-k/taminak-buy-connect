import { createFileRoute } from "@tanstack/react-router";

import { ComingSoon, PageShell } from "@/components/page-shell";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "سفارش‌های من | تأمینک" },
      { name: "description", content: "پیگیری وضعیت سفارش‌های ثبت‌شده برای هر تأمین‌کننده." },
      { property: "og:title", content: "سفارش‌های من در تأمینک" },
      { property: "og:description", content: "تاریخچه و وضعیت سفارش‌های کسب‌وکار شما." },
    ],
  }),
  component: () => (
    <PageShell title="سفارش‌های من" description="وضعیت سفارش‌های ثبت‌شده برای تأمین‌کننده‌ها">
      <ComingSoon phase="فاز ۳ (سبد و سفارش)" />
    </PageShell>
  ),
});