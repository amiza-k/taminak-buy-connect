import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "ورود به تأمینک | بازار تأمین کافه و رستوران" },
      {
        name: "description",
        content: "وارد حساب کاربری تأمینک شوید و سفارش‌ها و سبد خرید کسب‌وکارتان را مدیریت کنید.",
      },
      { property: "og:title", content: "ورود به تأمینک" },
      { property: "og:description", content: "ورود به حساب کاربری بازار B2B تأمینک." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("ورود ناموفق بود", { description: error.message });
      return;
    }
    toast.success("خوش آمدید");
    navigate({ to: "/products" });
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>ورود به تأمینک</CardTitle>
          <CardDescription>با ایمیل و رمز عبور خود وارد شوید.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
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
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "در حال ورود…" : "ورود"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            حساب ندارید؟{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              ثبت‌نام
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
