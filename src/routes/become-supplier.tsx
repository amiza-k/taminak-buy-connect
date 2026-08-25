import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageShell } from "@/components/page-shell";
import { LoadingState } from "@/components/catalog";
import { useAuth } from "@/hooks/use-auth";
import { IRAN_PROVINCES, citiesOf } from "@/lib/iran-locations";
import {
  useSupplierMembership,
  useMySupplierApplication,
  useSubmitSupplierApplication,
  SUBMISSION_STATUS_LABELS,
} from "@/lib/supplier";

export const Route = createFileRoute("/become-supplier")({
  head: () => ({
    meta: [
      { title: "درخواست فروشندگی | تأمینک" },
      {
        name: "description",
        content: "تأمین‌کننده هستید؟ درخواست فروشندگی خود را ثبت کنید و به بازار تأمینک بپیوندید.",
      },
      { property: "og:title", content: "درخواست فروشندگی در تأمینک" },
      {
        property: "og:description",
        content: "ثبت درخواست همکاری برای فروش به کافه‌ها و رستوران‌ها.",
      },
    ],
  }),
  component: BecomeSupplierPage,
});

function BecomeSupplierPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <PageShell title="درخواست فروشندگی">
        <LoadingState />
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell
        title="درخواست فروشندگی"
        description="برای ثبت درخواست فروشندگی ابتدا وارد حساب خود شوید یا ثبت‌نام کنید"
      >
        <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-border bg-card p-8">
          <Button asChild>
            <Link to="/login">ورود</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/signup">ثبت‌نام</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  return <AuthenticatedBecomeSupplier />;
}

function AuthenticatedBecomeSupplier() {
  const navigate = useNavigate();
  const { organization, isApproved, isPending: membershipPending } = useSupplierMembership();
  const applicationQuery = useMySupplierApplication();

  useEffect(() => {
    if (isApproved && organization) {
      navigate({ to: "/supplier", replace: true });
    }
  }, [isApproved, organization, navigate]);

  if (membershipPending || applicationQuery.isPending || (isApproved && organization)) {
    return (
      <PageShell title="درخواست فروشندگی">
        <LoadingState />
      </PageShell>
    );
  }

  const application = applicationQuery.data;

  if (application && application.status === "pending") {
    return (
      <PageShell title="درخواست فروشندگی" description="درخواست شما در حال بررسی است">
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <Badge variant="secondary">{SUBMISSION_STATUS_LABELS["pending"]}</Badge>
          <p className="mt-4 text-sm text-muted-foreground">
            درخواست فروشندگی «{application.business_name}» ثبت شده و در انتظار بررسی تیم تأمینک است.
          </p>
        </div>
      </PageShell>
    );
  }

  if (application && application.status === "rejected") {
    return (
      <PageShell title="درخواست فروشندگی" description="درخواست قبلی شما رد شده است">
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <p className="text-sm text-destructive">درخواست «{application.business_name}» رد شد.</p>
          {application.rejection_reason ? (
            <p className="mt-2 text-sm text-muted-foreground">دلیل: {application.rejection_reason}</p>
          ) : null}
        </div>
        <SupplierApplicationForm />
              </PageShell>
    );
  }

  return (
    <PageShell
      title="درخواست فروشندگی"
      description="اطلاعات کسب‌وکار خود را ثبت کنید تا پس از بررسی، فروشگاه شما فعال شود"
    >
      <SupplierApplicationForm />
          </PageShell>
  );
}

function SupplierApplicationForm() {
  const submit = useSubmitSupplierApplication();

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [province, setProvince] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!province || !city) {
      toast.error("لطفاً استان و شهر خود را انتخاب کنید");
      return;
    }
    submit.mutate(
      {
        business_name: businessName,
        owner_name: ownerName,
        phone,
        email,
        province,
        city,
        address,
        description,
      },
      {
        onSuccess: () => toast.success("درخواست فروشندگی ثبت شد"),
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
        <Label htmlFor="biz-name">نام کسب‌وکار</Label>
        <Input id="biz-name" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="owner-name">نام مسئول کسب‌وکار</Label>
        <Input id="owner-name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="biz-phone">تلفن</Label>
          <Input id="biz-phone" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="biz-email">ایمیل</Label>
          <Input id="biz-email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
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
        <Label htmlFor="biz-address">آدرس</Label>
        <Input id="biz-address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="biz-desc">توضیحات کسب‌وکار (اختیاری)</Label>
        <Textarea id="biz-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={submit.isPending}>
        {submit.isPending ? "در حال ثبت…" : "ثبت درخواست فروشندگی"}
      </Button>
    </form>
  );
}