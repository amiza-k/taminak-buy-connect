import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, LoadingState } from "@/components/catalog";
import { canonicalProductSearchQuery, type CanonicalProductOption } from "@/lib/catalog";
import { categoriesQuery } from "@/lib/categories";
import {
  useSupplierMembership,
  useCreateSubmission,
  useAttachOfferToProduct,
} from "@/lib/supplier";

export const Route = createFileRoute("/_authenticated/supplier/products/new")({
  head: () => ({ meta: [{ title: "افزودن محصول | تأمینک" }] }),
  component: NewOfferPage,
});

type Step = "search" | "attach-offer" | "submit-new";

function NewOfferPage() {
  const { organization } = useSupplierMembership();
  const orgId = organization?.id ?? null;
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("search");
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<CanonicalProductOption | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(term.trim()), 300);
    return () => clearTimeout(handle);
  }, [term]);

  const searchResults = useQuery({
    ...canonicalProductSearchQuery(debounced),
    enabled: step === "search" && debounced.length > 0,
  });

  if (step === "attach-offer" && selectedProduct) {
    return (
      <AttachOfferForm
        product={selectedProduct}
        orgId={orgId}
        onBack={() => setStep("search")}
        onDone={() => navigate({ to: "/supplier/products" })}
      />
    );
  }

  if (step === "submit-new") {
    return (
      <SubmitNewProductForm
        orgId={orgId}
        prefillName={term}
        onBack={() => setStep("search")}
        onDone={() => navigate({ to: "/supplier/submissions" })}
      />
    );
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <Label htmlFor="product-search">جست‌وجوی محصول</Label>
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-input px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            id="product-search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="مثلاً: سیروپ کارامل"
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          ابتدا محصول Canonical موجود را انتخاب کنید و سپس قیمت، موجودی و رسانهٔ خودتان را اضافه
          کنید.
        </p>
      </div>

      {debounced.length === 0 ? null : searchResults.isPending ? (
        <LoadingState />
      ) : (searchResults.data ?? []).length === 0 ? (
        <EmptyState label="محصولی با این نام پیدا نشد." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          {(searchResults.data ?? []).map((product, index) => (
            <button
              key={product.id}
              type="button"
              onClick={() => {
                setSelectedProduct(product);
                setStep("attach-offer");
              }}
              className={`flex w-full items-center gap-3 p-4 text-start transition-colors hover:bg-secondary/50 ${
                index > 0 ? "border-t border-border" : ""
              }`}
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary/60 text-muted-foreground">
                <Package className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[product.brand, product.unit].filter(Boolean).join(" — ") || "—"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setStep("submit-new")}
      >
        محصول موردنظر من پیدا نشد
      </Button>
    </div>
  );
}

/** Step 2a: attach the supplier's own offer to an existing canonical product. */
function AttachOfferForm({
  product,
  orgId,
  onBack,
  onDone,
}: {
  product: CanonicalProductOption;
  orgId: string | null;
  onBack: () => void;
  onDone: () => void;
}) {
  const attach = useAttachOfferToProduct(orgId);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [description, setDescription] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const unitPrice = Number(price);
    const stockQuantity = Number(stock);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      toast.error("قیمت نامعتبر است");
      return;
    }
    if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
      toast.error("موجودی نامعتبر است");
      return;
    }
    attach.mutate(
      {
        productId: product.id,
        unitPrice,
        stockQuantity,
        ...(description.trim() ? { description: description.trim() } : {}),
      },
      {
        onSuccess: () => {
          toast.success("محصول به فروشگاه شما اضافه شد");
          onDone();
        },
        onError: () => toast.error("افزودن محصول ناموفق بود"),
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl space-y-4 rounded-xl border border-border bg-card p-5 shadow-card"
    >
      <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-card text-muted-foreground">
          <Package className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{product.name}</p>
          <p className="text-xs text-muted-foreground">
            {[product.brand, product.unit].filter(Boolean).join(" — ") || "—"}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          تغییر
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="offer-price">قیمت (تومان)</Label>
          <Input
            id="offer-price"
            dir="ltr"
            type="number"
            min={0}
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="offer-stock">موجودی</Label>
          <Input
            id="offer-stock"
            dir="ltr"
            type="number"
            min={0}
            required
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="offer-description">توضیحات اختصاصی شما (اختیاری)</Label>
        <Textarea
          id="offer-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        افزودن عکس و ویدیوی این پیشنهاد را می‌توانید پس از ذخیره، از صفحهٔ «محصولات من» انجام دهید.
      </p>

      <Button type="submit" className="w-full" disabled={attach.isPending || !orgId}>
        {attach.isPending ? "در حال افزودن…" : "افزودن به فروشگاه من"}
      </Button>
    </form>
  );
}

/** Step 2b: propose a brand-new canonical product (admin review required). */
function SubmitNewProductForm({
  orgId,
  prefillName,
  onBack,
  onDone,
}: {
  orgId: string | null;
  prefillName: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const createSubmission = useCreateSubmission(orgId);
  const categories = useQuery(categoriesQuery());

  const [name, setName] = useState(prefillName);
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!orgId) return;
    if (!categoryId) {
      toast.error("لطفاً دسته‌بندی را انتخاب کنید");
      return;
    }
    const categoryName = (categories.data ?? []).find((c) => c.id === categoryId)?.name ?? "";
    createSubmission.mutate(
      {
        proposed_name: name,
        proposed_description: description,
        proposed_category_id: categoryId,
        proposed_category_name: categoryName,
        proposed_brand: brand,
        proposed_unit: unit,
        proposed_price: price,
        proposed_sku: "",
      },
      {
        onSuccess: () => {
          toast.success("درخواست محصول ثبت شد و در انتظار بررسی است");
          onDone();
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          این درخواست برای محصول جدید توسط ادمین بررسی می‌شود.
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          بازگشت به جست‌وجو
        </Button>
      </div>

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
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="p-category" className="w-full">
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
          <Label htmlFor="p-brand">برند</Label>
          <Input id="p-brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="p-unit">واحد</Label>
          <Input
            id="p-unit"
            placeholder="کیلوگرم"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
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
