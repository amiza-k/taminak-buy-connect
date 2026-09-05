import { Link } from "@tanstack/react-router";
import { Home, Package, ShoppingCart, Store } from "lucide-react";

import { useCartCount } from "@/lib/cart";
import { formatNumber } from "@/lib/format";

const ITEMS = [
  { to: "/", label: "خانه", icon: Home },
  { to: "/products", label: "محصولات", icon: Package },
  { to: "/suppliers", label: "تأمین‌کننده‌ها", icon: Store },
] as const;

export function MobileNav() {
  const count = useCartCount();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden print:hidden">
            <ul className="mx-auto flex max-w-6xl items-stretch">
        {ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <Link
              to={item.to}
              className="flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground"
              activeProps={{ className: "text-primary font-medium" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          </li>
        ))}
        <li className="flex-1">
          <Link
            to="/cart"
            className="relative flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground"
            activeProps={{ className: "text-primary font-medium" }}
          >
            <span className="relative">
              <ShoppingCart className="size-5" />
              {count > 0 ? (
                <span className="absolute -end-2 -top-2 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">
                  {formatNumber(count)}
                </span>
              ) : null}
            </span>
            سبد خرید
          </Link>
        </li>
      </ul>
    </nav>
  );
}
