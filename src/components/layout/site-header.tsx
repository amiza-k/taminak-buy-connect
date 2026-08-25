import { Link } from "@tanstack/react-router";
import { LogOut, Menu, ShoppingCart, User } from "lucide-react";
import { useSupplierOrganization } from "@/hooks/use-organizations";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LocationPicker } from "@/components/location-picker";
import { useAuth } from "@/hooks/use-auth";
import { useCartCount } from "@/lib/cart";
import { formatNumber } from "@/lib/format";

const NAV = [
  { to: "/products", label: "محصولات" },
  { to: "/suppliers", label: "تأمین‌کننده‌ها" },
  { to: "/become-supplier", label: "درخواست فروشندگی" },
] as const;

function BrandMark() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-brand text-base font-bold text-primary-foreground">
        ت
      </span>
      <span className="text-lg font-bold tracking-tight">تأمینک</span>
    </Link>
  );
}

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const cartCount = useCartCount();
  const { organization: supplierOrg } = useSupplierOrganization();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="منو">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle>تأمینک</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <BrandMark />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "text-foreground font-medium" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <LocationPicker className="hidden sm:inline-flex" />

          <Button variant="ghost" size="icon" asChild aria-label="سبد خرید" className="relative">
            <Link to="/cart">
              <ShoppingCart className="size-5" />
              {cartCount > 0 ? (
                <span className="absolute -end-1 -top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">
                  {formatNumber(cartCount)}
                </span>
              ) : null}
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="حساب کاربری">
                  <User className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/orders">سفارش‌های من</Link>
                </DropdownMenuItem>
               <DropdownMenuItem asChild>
                  <Link to="/onboarding">کسب‌وکار من</Link>
                </DropdownMenuItem>
                {supplierOrg ? (
                  <DropdownMenuItem asChild>
                    <Link to="/supplier/orders">سفارش‌های دریافتی</Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void signOut()}>
                  <LogOut className="size-4" />
                  خروج از حساب
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">ورود</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">ثبت‌نام</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}