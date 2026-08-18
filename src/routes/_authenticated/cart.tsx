import { createFileRoute } from "@tanstack/react-router";

import { ComingSoon, PageShell } from "@/components/page-shell";

export const Route = createFileRoute("/_authenticated/cart")({
  head: () => ({
    meta: [
      { title: "سبد خرید | تأمینک" },
      { name: "description", content: "سبد خرید چند تأمین‌کننده‌ای کسب‌وکار شما." },
      { property: "og:title", content: "سبد خرید تأمینک" },
      { property: "og:description", content: "مدیریت سبد خرید و ثبت سفارش برای هر تأمین‌کننده." },
    ],
  }),
  component: () => (
    <PageShell title="سبد خرید" description="اقلام شما بر اساس تأمین‌کننده گروه‌بندی می‌شود">
      <ComingSoon phase="فاز ۳ (سبد و سفارش)" />
    </PageShell>
  ),
});