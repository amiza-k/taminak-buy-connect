import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { IRAN_PROVINCES, citiesOf } from "@/lib/iran-locations";
import { useMarketLocation } from "@/hooks/use-location";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "ثبت‌نام در تأمینک | خرید مواد اولیه کافه و رستوران" },
      {
        name: "description",
        content:
          "حساب شخصی بسازید، استان و شهر خود را انتخاب کنید و تأمین‌کننده‌های مواد اولیه را مقایسه کنید.",
      },
      { property: "og:title", content: "ثبت‌نام در تأمینک" },
      {
        property: "og:description",
        content: "ساخت حساب کاربری برای خرید و مقایسه تأمین‌کننده‌های کافه و رستوران.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { setLocation } = useMarketLocation();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [province, setProvince] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!province || !city) {
      toast.error("لطفاً استان و شهر خود را انتخاب کنید");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/products`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);

    if (error) {
      toast.error("ثبت‌نام ناموفق بود", { description: error.message });
      return;
    }

    setLocation({ province, city });

    if (!data.session) {
      toast.success("ثبت‌نام انجام شد", {
        description: "برای فعال‌سازی حساب، ایمیل خود را بررسی کنید.",
      });
      navigate({ to: "/login" });
      return;
    }

    toast.success("حساب شما ساخته شد");
    navigate({ to: "/products" });
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>ثبت‌نام در تأمینک</CardTitle>
          <CardDescription>
            فقط اطلاعات شخصی لازم است؛ ثبت کسب‌وکار بعداً و هنگام سفارش انجام می‌شود.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">نام و نام خانوادگی</Label>
              <Input
                id="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                dir="ltr"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <Input
                id="password"
                type="password"
                dir="ltr"
                minLength={6}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
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
                <Select
                  {...(city ? { value: city } : {})}
                  disabled={!province}
                  onValueChange={setCity}
                >
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "در حال ساخت حساب…" : "ثبت‌نام"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            قبلاً ثبت‌نام کرده‌اید؟{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              ورود
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}