import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState, ErrorState } from "@/components/catalog";
import { IRAN_PROVINCES, citiesOf } from "@/lib/iran-locations";
import {
  useSupplierMembership,
  supplierOrgDetailQuery,
  useUpdateSupplierOrganization,
  APPLICATION_STATUS_LABELS,
} from "@/lib/supplier";

export const Route = createFileRoute("/_authenticated/supplier/profile")({
  head: () => ({ meta: [{ title: "پروفایل فروشنده | تأمینک" }] }),
  component: SupplierProfilePage,
});

function SupplierProfilePage() {
  const { organization } = useSupplierMembership();
  const orgId = organization?.id ?? null;
  const query = useQuery({ ...supplierOrgDetailQuery(orgId), enabled: Boolean(orgId) });
  const updateOrg = useUpdateSupplierOrganization(orgId);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);

  useEffect(() => {
    if (!query.data) return;
    setName(query.data.name ?? "");
    setPhone(query.data.phone ?? "");
    setEmail(query.data.email ?? "");
    setAddress(query.data.address ?? "");
    setProvince(query.data.province);
    setCity(query.data.city);
  }, [query.data]);

  if (query.isPending) return <LoadingState />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    updateOrg.mutate(
      {
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
        province,
        city,
      },
      {
        onSuccess: () => toast.success("پروفایل به‌روزرسانی شد"),
        onError: () => toast.error("ذخیره تغییرات ناموفق بود"),
      },
    );
  }

  return (
    <div className="max-w-xl space-y-4">
      <Badge variant="secondary">
        {APPLICATION_STATUS_LABELS[query.data.supplier_status ?? ""] ?? query.data.supplier_status}
      </Badge>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-card"
      >
        <div className="space-y-2">
          <Label htmlFor="s-name">نام کسب‌وکار</Label>
          <Input id="s-name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="s-phone">تلفن</Label>
            <Input
              id="s-phone"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-email">ایمیل</Label>
            <Input
              id="s-email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>استان</Label>
            <Select
              {...(province ? { value: province } : {})}
              onValueChange={(value) => {
                setProvince(value);
                setCity(null);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="انتخاب" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {IRAN_PROVINCES.map((p) => (
                  <SelectItem key={p.name} value={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>شهر</Label>
            <Select {...(city ? { value: city } : {})} disabled={!province} onValueChange={setCity}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="انتخاب" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {citiesOf(province).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="s-address">آدرس</Label>
          <Input id="s-address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <Button type="submit" disabled={updateOrg.isPending}>
          {updateOrg.isPending ? "در حال ذخیره…" : "ذخیره تغییرات"}
        </Button>
      </form>
    </div>
  );
}
