import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { useMyMemberships } from "@/hooks/use-organizations";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "کسب‌وکار من | تأمینک" },
      {
        name: "description",
        content: "کافه یا رستوران خود را ثبت کنید تا بتوانید سبد خرید و سفارش سازمانی داشته باشید.",
      },
      { property: "og:title", content: "ثبت کسب‌وکار در تأمینک" },
      { property: "og:description", content: "ساخت مجموعه رستوران یا کافه برای ثبت سفارش." },
    ],
  }),
  component: OnboardingPage,
});

const ROLE_LABELS: Record<string, string> = {
  owner: "مالک",
  manager: "مدیر",
  purchasing_manager: "مدیر خرید",
  supplier_admin: "مدیر تأمین‌کننده",
  supplier_staff: "کارشناس تأمین‌کننده",
  member: "عضو",
};

function OnboardingPage() {
  const queryClient = useQueryClient();
  const memberships = useMyMemberships();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const createOrg = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("create_organization_with_owner", {
        p_name: name,
        p_type: "restaurant",
        p_phone: phone || undefined,
        p_email: email || undefined,
        p_address: address || undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("کسب‌وکار شما ثبت شد");
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
    },
    onError: (error: Error) => {
      toast.error("ثبت کسب‌وکار ناموفق بود", { description: error.message });
    },
  });

  return (
    <PageShell
      title="کسب‌وکار من"
      description="برای ثبت سفارش، ابتدا کافه یا رستوران خود را ایجاد کنید"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4 text-primary" />
              مجموعه‌های من
            </CardTitle>
            <CardDescription>یک نفر می‌تواند عضو چند کسب‌وکار باشد.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {memberships.isLoading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : memberships.data && memberships.data.length > 0 ? (
              memberships.data.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium">{m.organizations?.name ?? "بدون نام"}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.organizations?.type === "supplier" ? "تأمین‌کننده" : "رستوران / کافه"}
                      {m.organizations?.city ? ` — ${m.organizations.city}` : ""}
                    </p>
                  </div>
                  <Badge variant="secondary">{ROLE_LABELS[m.role] ?? m.role}</Badge>
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                هنوز کسب‌وکاری ثبت نکرده‌اید.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">ثبت کافه یا رستوران جدید</CardTitle>
            <CardDescription>کافه‌ها نیز با نوع «رستوران» ثبت می‌شوند.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
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
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-email">ایمیل</Label>
                  <Input
                    id="org-email"
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
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createOrg.isPending}>
                <Check className="size-4" />
                {createOrg.isPending ? "در حال ثبت…" : "ثبت کسب‌وکار"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}