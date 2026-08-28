import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingState } from "@/components/catalog";
import { adminProductsQuery } from "@/lib/admin";
import { categoriesQuery } from "@/lib/categories";
import { formatNumber } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/products/")({
  head: () => ({ meta: [{ title: "کاتالوگ محصولات | پنل مدیریت" }] }),
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const categories = useQuery(categoriesQuery());
  const query = useQuery(adminProductsQuery({ search, categoryId }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="flex min-w-[14rem] flex-1 items-center gap-2 rounded-lg border border-input px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جست‌وجوی محصول"
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
          </div>
          <Select
            {...(categoryId ? { value: categoryId } : {})}
            onValueChange={(value) => setCategoryId(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="همه دسته‌بندی‌ها" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه دسته‌بندی‌ها</SelectItem>
              {(categories.data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button asChild size="sm">
          <Link to="/admin/products/new">محصول جدید</Link>
        </Button>
      </div>

      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState label="محصولی پیدا نشد." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          {(query.data ?? []).map((product, index) => (
            <Link
              key={product.id}
              to="/admin/products/$productId"
              params={{ productId: product.id }}
              className={`flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-secondary/40 ${
                index > 0 ? "border-t border-border" : ""
              }`}
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary/60 text-muted-foreground">
                <Package className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.category ?? "بدون دسته‌بندی"}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatNumber(product.offerCount)} تأمین‌کننده
              </span>
              <Badge variant={product.is_active ? "secondary" : "outline"}>
                {product.is_active ? "فعال" : "غیرفعال"}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}