import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";

import { EmptyState, ErrorState, LoadingState } from "@/components/catalog";
import { categoriesQuery } from "@/lib/categories";
import {
  adminProductQuery,
  adminProductOfferCountQuery,
  useUpdateAdminProduct,
  useDeleteAdminProduct,
} from "@/lib/admin";
import { formatNumber } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/products/$productId")({
  head: () => ({ meta: [{ title: "ویرایش محصول | پنل مدیریت" }] }),
  component: AdminProductDetailPage,
});

function AdminProductDetailPage() {
  const { productId } = Route.useParams();
  const categories = useQuery(categoriesQuery());
  const query = useQuery(adminProductQuery(productId));
  const offerCount = useQuery(adminProductOfferCountQuery(productId));
  const update = useUpdateAdminProduct(productId);
  const deleteProduct = useDeleteAdminProduct();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [unit, setUnit] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!query.data) return;
    setName(query.data.name ?? "");
    setDescription(query.data.description ?? "");
    setCategoryId(query.data.category_id ?? "");
    setBrand(query.data.brand ?? "");
    setUnit(query.data.unit ?? "");
    setImageUrl(query.data.image_url ?? "");
    setIsActive(query.data.is_active);
  }, [query.data]);

  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;
  if (!query.data) return <EmptyState label="محصولی پیدا نشد." />;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!categoryId) {
      toast.error("لطفاً دسته‌بندی را انتخاب کنید");
      return;
    }
    const categoryName = (categories.data ?? []).find((c) => c.id === categoryId)?.name ?? "";
    update.mutate(
      {
        name: name.trim(),
        description: description.trim() || null,
        categoryId,
        categoryName,
        brand: brand.trim() || null,
        unit: unit.trim() || null,
        imageUrl: imageUrl.trim() || null,
        isActive,
      },
      {
        onSuccess: () => toast.success("محصول به‌روزرسانی شد"),
        onError: () => toast.error("ذخیره تغییرات ناموفق بود"),
      },
    );
  }

    function handleDelete() {
    if (!window.confirm("این محصول برای همیشه حذف می‌شود. ادامه می‌دهید؟")) return;
    deleteProduct.mutate(productId, {
      onSuccess: () => {
        toast.success("محصول حذف شد");
        navigate({ to: "/admin/products" });
      },
      onError: () =>
        toast.error(
          "این محصول وابستگی دارد (مثلاً سفارش یا پیشنهاد فروشنده) و قابل حذف نیست؛ به‌جای حذف، آن را غیرفعال کنید.",
        ),
    });
  }

  return (
    <div className="max-w-xl space-y-4">
      <p className="text-sm text-muted-foreground">
        {formatNumber(offerCount.data ?? 0)} تأمین‌کننده این محصول را عرضه می‌کنند. قیمت، موجودی
        و رسانه هر تأمین‌کننده از این فرم قابل تغییر نیست.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-card"
      >
        <div className="space-y-2">
          <Label htmlFor="ep-name">نام محصول</Label>
          <Input id="ep-name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ep-desc">توضیحات</Label>
          <Textarea id="ep-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="ep-category">دسته‌بندی</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="ep-category" className="w-full">
                <SelectValue placeholder="انتخاب دسته‌بندی" />
              </SelectTrigger>
              <SelectContent>
                {(categories.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ep-brand">برند</Label>
            <Input id="ep-brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="ep-unit">واحد</Label>
            <Input id="ep-unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ep-image">آدرس تصویر</Label>
            <Input id="ep-image" dir="ltr" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          <span className="text-sm text-muted-foreground">{isActive ? "فعال" : "غیرفعال"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? "در حال ذخیره…" : "ذخیره تغییرات"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="text-destructive hover:text-destructive"
            disabled={deleteProduct.isPending}
            onClick={handleDelete}
          >
            <Trash2 className="size-4" />
            حذف محصول
          </Button>
        </div>
      </form>
    </div>
  );
}