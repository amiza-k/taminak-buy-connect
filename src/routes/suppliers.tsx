import { createFileRoute } from "@tanstack/react-router";

import { ComingSoon, PageShell } from "@/components/page-shell";

export const Route = createFileRoute("/suppliers")({
  head: () => ({
    meta: [
      { title: "تأمین‌کننده‌ها | تأمینک" },
      {
        name: "description",
        content: "تأمین‌کننده‌های مواد اولیه کافه و رستوران را بر اساس استان، شهر و امتیاز پیدا کنید.",
      },
      { property: "og:title", content: "تأمین‌کننده‌های تأمینک" },
      { property: "og:description", content: "کشف تأمین‌کننده‌های معتبر در شهر و استان شما." },
    ],
  }),
  component: () => (
    <PageShell title="تأمین‌کننده‌ها" description="کشف تأمین‌کننده‌ها بر اساس موقعیت و امتیاز">
      <ComingSoon phase="فاز ۲ (بازار خریدار)" />
    </PageShell>
  ),
});