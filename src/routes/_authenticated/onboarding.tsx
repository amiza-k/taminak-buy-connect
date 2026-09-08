import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Check, MapPin, Pencil, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { MapPicker, type LatLng } from "@/components/map/map-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { type MembershipWithOrg, useMyMemberships } from "@/hooks/use-organizations";

export const Route = createFileRoute("/_authenticated/onboarding")({ component: OnboardingPage });

const ROLE_LABELS: Record<string, string> = {
  owner: "مالک",
  manager: "مدیر",
  purchasing_manager: "مدیر خرید",
  supplier_admin: "مدیر تأمین‌کننده",
  supplier_staff: "کارشناس تأمین‌کننده",
  member: "عضو",
};

function VerificationButton({
  organizationId,
  channel,
  verified,
}: {
  organizationId: string;
  channel: "phone";
  verified: boolean;
}) {
  const [code, setCode] = useState("");
  const queryClient = useQueryClient();
  const verify = useMutation({
    mutationFn: async (body: { code?: string }) => {
      const { data, error } = await supabase.functions.invoke("organization-verification", {
        body: { organizationId, channel, ...body },
      });
      if (error) {
        const response = error.context;
        if (response instanceof Response) {
          const payload = await response.json().catch(() => null);
          if (typeof payload?.error === "string") throw new Error(payload.error);
        }
        throw error;
      }
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: (_, variables) => {
      if (variables.code) {
        toast.success("تأیید شد");
        queryClient.invalidateQueries({ queryKey: ["memberships"] });
      } else toast.success("کد تأیید ارسال شد");
    },
    onError: (error: Error) =>
      toast.error("عملیات تأیید ناموفق بود", { description: error.message }),
  });
  if (verified) return <Badge variant="secondary">تأیید شده</Badge>;
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => verify.mutate({})}
        disabled={verify.isPending}
      >
        ارسال کد
      </Button>
      <Input
        aria-label="کد تأیید"
        className="h-8 w-24"
        dir="ltr"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="۶ رقم"
      />
      <Button
        type="button"
        size="sm"
        onClick={() => verify.mutate({ code })}
        disabled={verify.isPending || code.length !== 6}
      >
        تأیید
      </Button>
    </div>
  );
}

function EditOrganizationDialog({
  membership,
  open,
  onOpenChange,
}: {
  membership: MembershipWithOrg | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const organization = membership?.organizations;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<LatLng | null>(null);

  const updateOrganization = useMutation({
    mutationFn: async () => {
      if (!organization) return;
      const { error } = await supabase
        .from("organizations")
        .update({
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
        })
        .eq("id", organization.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تغییرات مجموعه ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      onOpenChange(false);
    },
    onError: (error: Error) =>
      toast.error("ذخیره تغییرات ناموفق بود", { description: error.message }),
  });

  useEffect(() => {
    if (!open) return;
    setName(organization?.name ?? "");
    setPhone(organization?.phone ?? "");
    setEmail(organization?.email ?? "");
    setAddress(organization?.address ?? "");
    setCoords(
      organization?.latitude !== null &&
        organization?.latitude !== undefined &&
        organization.longitude !== null &&
        organization.longitude !== undefined
        ? { lat: organization.latitude, lng: organization.longitude }
        : null,
    );
  }, [open, organization]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>ویرایش مجموعه</DialogTitle>
          <DialogDescription>تغییر شماره تلفن، نیاز به تأیید دوباره آن دارد.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim() || !phone.trim() || !email.trim() || !address.trim()) {
              toast.error("نام، تلفن، ایمیل و آدرس الزامی است.");
              return;
            }
            updateOrganization.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="edit-org-name">نام کسب‌وکار</Label>
            <Input
              id="edit-org-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-org-phone">تلفن</Label>
              <Input
                id="edit-org-phone"
                required
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-org-email">ایمیل</Label>
              <Input
                id="edit-org-email"
                required
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-org-address">آدرس</Label>
            <Textarea
              id="edit-org-address"
              required
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <MapPin className="size-4" />
              موقعیت دقیق روی نقشه
            </Label>
            <MapPicker
              value={coords}
              onChange={setCoords}
              className="h-56 w-full rounded-lg border border-border"
            />
          </div>
          <Button type="submit" className="w-full" disabled={updateOrganization.isPending}>
            {updateOrganization.isPending ? "در حال ذخیره…" : "ذخیره تغییرات"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OnboardingPage() {
  const queryClient = useQueryClient();
  const memberships = useMyMemberships();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [editingMembership, setEditingMembership] = useState<MembershipWithOrg | null>(null);
  const createOrg = useMutation({
    mutationFn: async () => {
      const { data: organizationId, error } = await supabase.rpc("create_organization_with_owner", {
        p_name: name,
        p_type: "restaurant",
        p_phone: phone,
        p_email: email,
        p_address: address,
      });
      if (error) throw error;
      if (coords) {
        const { error: locationError } = await supabase
          .from("organizations")
          .update({ latitude: coords.lat, longitude: coords.lng })
          .eq("id", organizationId);
        if (locationError) throw locationError;
      }
    },
    onSuccess: () => {
      toast.success("کسب‌وکار ثبت شد؛ اکنون تلفن را تأیید کنید.");
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setCoords(null);
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
    },
    onError: (error: Error) =>
      toast.error("ثبت کسب‌وکار ناموفق بود", { description: error.message }),
  });
  return (
    <PageShell title="کسب‌وکار من" description="برای ثبت سفارش، یک لوکیشن با تلفن تأییدشده بسازید">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4 text-primary" />
              مجموعه‌های من
            </CardTitle>
            <CardDescription>
              فقط لوکیشن‌های دارای تلفن تأییدشده برای سفارش استفاده می‌شوند.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {memberships.isLoading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : memberships.data?.filter((m) => m.organizations?.type !== "supplier").length ? (
              memberships.data
                .filter((m) => m.organizations?.type !== "supplier")
                .map((m) => (
                  <div key={m.id} className="space-y-3 rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{m.organizations?.name ?? "بدون نام"}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.organizations?.city ?? "لوکیشن کسب‌وکار"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{ROLE_LABELS[m.role] ?? m.role}</Badge>
                        {(m.role === "owner" || m.role === "manager") && m.organizations && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingMembership(m)}
                          >
                            <Pencil className="size-4" />
                            ویرایش
                          </Button>
                        )}
                      </div>
                    </div>
                    {(m.role === "owner" || m.role === "manager") && m.organizations && (
                      <div className="space-y-2 border-t pt-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1">
                            <Smartphone className="size-4" />
                            تلفن
                          </span>
                          <VerificationButton
                            organizationId={m.organization_id}
                            channel="phone"
                            verified={m.organizations.phone_verified}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))
            ) : (
              <p className="text-sm text-muted-foreground">هنوز کسب‌وکاری ثبت نکرده‌اید.</p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">ثبت کافه یا رستوران جدید</CardTitle>
            <CardDescription>
              آدرس، تلفن و ایمیل این لوکیشن در سفارش‌ها استفاده می‌شود.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!phone || !email || !address) {
                  toast.error("تلفن، ایمیل و آدرس الزامی است.");
                  return;
                }
                createOrg.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="org-name">نام کسب‌وکار</Label>
                <Input
                  id="org-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="org-phone">تلفن</Label>
                  <Input
                    id="org-phone"
                    required
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-email">ایمیل</Label>
                  <Input
                    id="org-email"
                    required
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-address">آدرس</Label>
                <Textarea
                  id="org-address"
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <MapPin className="size-4" />
                  موقعیت دقیق روی نقشه
                </Label>
                <MapPicker
                  value={coords}
                  onChange={setCoords}
                  className="h-56 w-full rounded-lg border border-border"
                />
                <p className="text-xs text-muted-foreground">
                  برای جابه‌جایی نشانگر روی نقشه کلیک کنید یا آن را بکشید.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={createOrg.isPending}>
                <Check className="size-4" />
                {createOrg.isPending ? "در حال ثبت…" : "ثبت کسب‌وکار"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <EditOrganizationDialog
        membership={editingMembership}
        open={Boolean(editingMembership)}
        onOpenChange={(open) => {
          if (!open) setEditingMembership(null);
        }}
      />
    </PageShell>
  );
}
