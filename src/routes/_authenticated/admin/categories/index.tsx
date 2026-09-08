import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EmptyState, ErrorState, LoadingState } from "@/components/catalog";
import {
  adminCategoriesQuery,
  useCreateCategory,
  useSetCategoryActive,
  useDeleteCategory,
} from "@/lib/categories";

export const Route = createFileRoute("/_authenticated/admin/categories/")({
  head: () => ({ meta: [{ title: "دسته‌بندی‌ها | پنل مدیریت" }] }),
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  const query = useQuery(adminCategoriesQuery());
  const create = useCreateCategory();
  const setActive = useSetCategoryActive();
  const remove = useDeleteCategory();

  const [name, setName] = useState("");

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim() },
      {
        onSuccess: () => {
          toast.success("دسته‌بندی اضافه شد");
          setName("");
        },
        onError: () => toast.error("افزودن دسته‌بندی ناموفق بود"),
      },
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <form
        onSubmit={handleCreate}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-5 shadow-card"
      >
        <div className="flex-1 space-y-2">
          <Label htmlFor="cat-name">دسته‌بندی جدید</Label>
          <Input
            id="cat-name"
            placeholder="مثلاً: خشکبار"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={create.isPending || !name.trim()}>
          {create.isPending ? "در حال افزودن…" : "افزودن"}
        </Button>
      </form>

      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState label="هنوز دسته‌بندی‌ای ثبت نشده است." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          {(query.data ?? []).map((category, index) => (
            <div
              key={category.id}
              className={`flex flex-wrap items-center gap-3 p-4 ${
                index > 0 ? "border-t border-border" : ""
              }`}
            >
              <div className="min-w-[10rem] flex-1">
                <p className="font-medium">{category.name}</p>
                <p className="text-xs text-muted-foreground" dir="ltr">
                  {category.slug}
                </p>
              </div>
              <Badge variant={category.is_active ? "secondary" : "outline"}>
                {category.is_active ? "فعال" : "غیرفعال"}
              </Badge>
              <div className="flex items-center gap-2">
                <Switch
                  checked={category.is_active}
                  disabled={setActive.isPending}
                  onCheckedChange={(checked) =>
                    setActive.mutate(
                      { categoryId: category.id, isActive: checked },
                      { onError: () => toast.error("تغییر وضعیت ناموفق بود") },
                    )
                  }
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={remove.isPending}
                  onClick={() =>
                    remove.mutate(category.id, {
                      onSuccess: () => toast.success("دسته‌بندی حذف شد"),
                      onError: () =>
                        toast.error(
                          "این دسته‌بندی به محصولی متصل است؛ ابتدا محصولات آن را جابه‌جا یا آن را غیرفعال کنید.",
                        ),
                    })
                  }
                  aria-label="حذف دسته‌بندی"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
