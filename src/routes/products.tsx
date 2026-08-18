import { createFileRoute } from "@tanstack/react-router";

import { ComingSoon, PageShell } from "@/components/page-shell";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "محصولات | تأمینک" },
      {
        name: "description",
        content: "جست‌وجو و مقایسه قیمت مواد اولیه و ملزومات کافه و رستوران بین تأمین‌کننده‌ها.",
      },
      { property: "og:title", content: "محصولات تأمینک" },
      { property: "og:description", content: "مقایسه قیمت و موجودی محصولات بین تأمین‌کننده‌ها." },
    ],
  }),
  component: () => (
    <PageShell title="محصولات" description="جست‌وجو، مقایسه قیمت و انتخاب تأمین‌کننده">
      <ComingSoon phase="فاز ۲ (بازار خریدار)" />
    </PageShell>
  ),
});