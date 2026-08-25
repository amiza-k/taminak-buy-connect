import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSupplierMembership, useCreateSubmission } from "@/lib/supplier";

export const Route = createFileRoute("/_authenticated/supplier/products/new")({
  head: () => ({ meta: [{ title: "درخواست محصول جدید | تأمینک" }] }),
  component: NewProductSubmissionPage,
});

function NewProductSubmissionPage() {
  const { organization } = useSupplierMembership();
  const orgId = organization?.id ?? null;
  const navigate = useNavigate();
  const createSubmission = useCreateSubmission(orgId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!orgId) return;
    createSubmission.mutate(
      {
        proposed_name: name,
        proposed_description: description,
        proposed_category: category,
        proposed_brand: brand,
        proposed_unit: unit,
        proposed_price: price,
        proposed_sku: "",
      },
      {
        onSuccess: () => {
          toast.success("درخواست محصول ثبت شد و در انتظار بررسی است");
          navigate({ to: "/supplier/submissions" });
        },
        onError: () => toast.error("ثبت درخواست ناموفق بود"),
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl space-y-4 rounded-xl border border-border bg-card p-5 shadow-card"
    >
      <div className="space-y-2">
        <Label htmlFor="p-name">نام محصول</Label>
        <Input id="p-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="p-desc">توضیحات</Label>
        <Textarea
          id="p-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="p-category">دسته‌بندی</Label>
          <Input id="p-category" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-brand">برند</Label>
          <Input id="p-brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="p-unit">واحد</Label>
          <Input id="p-unit" placeholder="کیلوگرم" value={unit} onChange={(e) => setUnit(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-price">قیمت پیشنهادی (تومان)</Label>
          <Input
            id="p-price"
            dir="ltr"
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={createSubmission.isPending || !orgId}>
        {createSubmission.isPending ? "در حال ثبت…" : "ثبت درخواست"}
      </Button>
    </form>
  );
}