import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div className="space-y-2">
          <p className="text-lg font-bold">تأمینک</p>
          <p className="text-sm text-muted-foreground">
            بازار آنلاین تأمین مواد اولیه و ملزومات کافه و رستوران.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">خریداران</p>
          <Link to="/products" className="block text-muted-foreground hover:text-foreground">
            محصولات
          </Link>
          <Link to="/suppliers" className="block text-muted-foreground hover:text-foreground">
            تأمین‌کننده‌ها
          </Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">تأمین‌کننده‌ها</p>
          <Link
            to="/become-supplier"
            className="block text-muted-foreground hover:text-foreground"
          >
            درخواست فروشندگی
          </Link>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        تأمینک — تأمین هوشمند برای کسب‌وکارهای غذایی
      </div>
    </footer>
  );
}