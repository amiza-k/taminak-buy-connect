import { createFileRoute } from "@tanstack/react-router";

import { ComingSoon, PageShell } from "@/components/page-shell";

export const Route = createFileRoute("/become-supplier")({
  head: () => ({
    meta: [
      { title: "درخواست فروشندگی | تأمینک" },
      {
        name: "description",
        content: "تأمین‌کننده هستید؟ درخواست فروشندگی خود را ثبت کنید و به بازار تأمینک بپیوندید.",
      },
      { property: "og:title", content: "درخواست فروشندگی در تأمینک" },
      {
        property: "og:description",
        content: "ثبت درخواست همکاری برای فروش به کافه‌ها و رستوران‌ها.",
      },
    ],
  }),
  component: () => (
    <PageShell
      title="درخواست فروشندگی"
      description="اطلاعات کسب‌وکار خود را ثبت کنید تا پس از بررسی، فروشگاه شما فعال شود"
    >
      <ComingSoon phase="فاز ۴ (تأمین‌کننده)" />
    </PageShell>
  ),
});