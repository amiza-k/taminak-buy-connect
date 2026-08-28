import { useState } from "react";
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
import { categoriesQuery } from "@/lib/categories";
import { useCreateAdminProduct } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/products/new")({
  head: () => ({ meta: [{ title: "محصول جدید | پنل مدیریت" }] }),
  component: NewAdminProductPage,
});

function NewAdminProductPage() {
  const navigate = useNavigate();
  const categories = useQuery(categoriesQuery());
  const create = useCreateAdminProduct();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [unit, setUnit] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!categoryId) {
      toast.error("لطفاً دسته‌بندی را انتخاب کنید");
      return;
    }
    const categoryName = (categories.data ?? []).find((c) => c.id === categoryId)?.name ?? "";
    create.mutate(
      {
        name: name.trim(),
        categoryId,
        categoryName,
        isActive,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(brand.trim() ? { brand: brand.trim() } : {}),
        ...(unit.trim() ? { unit: unit.trim() } : {}),
        ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
      },
      {
        onSuccess: (data) => {
          toast.success("محصول ایجاد شد");
          navigate({ to: "/admin/products/$productId", params: { productId: data.id } });
        },
        onError: () => toast.error("ایجاد محصول ناموفق بود"),
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl space-y-4 rounded-xl border border-border bg-card p-5 shadow-card"
    >
      <div className="space-y-2">
        <Label htmlFor="ap-name">نام محصول</Label>
        <Input id="ap-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ap-desc">توضیحات</Label>
        <Textarea id="ap-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="ap-category">دسته‌بندی</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="ap-category" className="w-full">
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
          <Label htmlFor="ap-brand">برند</Label>
          <Input id="ap-brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="ap-unit">واحد</Label>
          <Input id="ap-unit" placeholder="کیلوگرم" value={unit} onChange={(e) => setUnit(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ap-image">آدرس تصویر</Label>
          <Input id="ap-image" dir="ltr" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={isActive} onCheckedChange={setIsActive} />
        <span className="text-sm text-muted-foreground">{isActive ? "فعال" : "غیرفعال"}</span>
      </div>
      <Button type="submit" className="w-full" disabled={create.isPending}>
        {create.isPending ? "در حال ایجاد…" : "ایجاد محصول"}
      </Button>
    </form>
  );
}