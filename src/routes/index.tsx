import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Building2, Search, ShieldCheck, Star, Store, Tags } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationPicker } from "@/components/location-picker";
import heroImage from "@/assets/hero-supply.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "تأمینک | تأمین و خرید مواد اولیه کافه و رستوران" },
      {
        name: "description",
        content:
          "محصولات موردنیاز کسب‌وکارتان را پیدا کنید، تأمین‌کننده‌ها و قیمت‌ها را مقایسه کنید و سفارش دهید.",
      },
      { property: "og:title", content: "تأمینک | بازار B2B کافه و رستوران" },
      {
        property: "og:description",
        content: "مقایسه تأمین‌کننده‌ها و قیمت‌ها و ثبت سفارش برای کافه و رستوران در سراسر ایران.",
      },
    ],
  }),
  component: Index,
});

const VALUE_ITEMS = [
  {
    icon: Search,
    title: "کشف محصول",
    body: "مواد اولیه و ملزومات موردنیاز آشپزخانه‌تان را در یک کاتالوگ یکپارچه پیدا کنید.",
  },
  {
    icon: Tags,
    title: "مقایسه قیمت",
    body: "یک محصول، چند تأمین‌کننده. قیمت و موجودی را کنار هم ببینید و انتخاب کنید.",
  },
  {
    icon: Star,
    title: "اعتماد و امتیاز",
    body: "امتیاز و نظرهای واقعی خریدارانی که سفارششان تکمیل شده است.",
  },
  {
    icon: Building2,
    title: "سفارش سازمانی",
    body: "سبد خرید متعلق به کسب‌وکار شماست و برای هر تأمین‌کننده سفارش جدا ثبت می‌شود.",
  },
];

function Index() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <img
          src={heroImage}
          alt="مواد اولیه و ملزومات عمده رستوران و کافه روی میز چوبی"
          className="absolute inset-0 size-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-brand-deep/95 via-brand-deep/85 to-brand-deep/55" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="max-w-2xl text-primary-foreground">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs backdrop-blur">
              <ShieldCheck className="size-3.5" />
              بازار تخصصی B2B کافه و رستوران
            </span>
            <h1 className="mt-5 text-3xl leading-tight font-extrabold sm:text-5xl">
              تأمین و خرید مواد اولیه برای کافه و رستوران
            </h1>
            <p className="mt-4 text-base opacity-90 sm:text-lg">
              محصولات موردنیاز کسب‌وکارتان را پیدا کنید، تأمین‌کننده‌ها و قیمت‌ها را مقایسه کنید و
              سفارش دهید.
            </p>

            <form
              className="mt-8 flex flex-col gap-2 rounded-xl bg-card p-2 sm:flex-row"
              onSubmit={(event) => {
              event.preventDefault();
              const term = query.trim();
              navigate({ to: "/products", search: term ? { q: term } : {} });
            }}
            >
              <div className="flex flex-1 items-center gap-2 px-2">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="چه محصولی نیاز دارید؟"
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                  aria-label="جست‌وجوی محصول"
                />
              </div>
              <div className="flex items-center gap-2">
                <LocationPicker />
                <Button type="submit" size="lg">
                  مشاهده محصولات
                </Button>
              </div>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
              <Link
                to="/suppliers"
                className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
              >
                مشاهده تأمین‌کننده‌ها
                <ArrowLeft className="size-4" />
              </Link>
              <span className="opacity-60">|</span>
              <Link
                to="/become-supplier"
                className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
              >
                <Store className="size-4" />
                فروشنده هستید؟ درخواست فروشندگی
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-xl font-bold sm:text-2xl">چرا تأمینک؟</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          یک مسیر ساده از پیدا کردن محصول تا هماهنگی نهایی با تأمین‌کننده.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUE_ITEMS.map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <span className="grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                <item.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-6">
        <div className="grid gap-4 rounded-2xl border border-border bg-secondary/50 p-6 sm:grid-cols-2 sm:p-10">
          <div>
            <h2 className="text-xl font-bold">مسیر خرید در تأمینک</h2>
            <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
              {[
                "محصول موردنیاز را جست‌وجو کنید",
                "پیشنهاد تأمین‌کننده‌های مختلف را مقایسه کنید",
                "اقلام را از چند تأمین‌کننده به سبد اضافه کنید",
                "برای هر تأمین‌کننده سفارش جداگانه ثبت کنید",
                "تأمین‌کننده برای پرداخت و ارسال با شما تماس می‌گیرد",
              ].map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
                    {["۱", "۲", "۳", "۴", "۵"][index]}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-col justify-center gap-3 rounded-xl bg-card p-6 shadow-card">
            <h3 className="text-base font-semibold">همین حالا شروع کنید</h3>
            <p className="text-sm text-muted-foreground">
              ثبت‌نام رایگان است و برای شروع فقط یک حساب شخصی لازم دارید.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/signup">ثبت‌نام</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/products">مشاهده محصولات</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
