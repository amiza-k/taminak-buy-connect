import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const encoder = new TextEncoder();

async function sha256(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) throw new Error("Unauthorized");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authorization } } },
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const { organizationId, channel, code } = await request.json();
    if (!organizationId || !["phone", "email"].includes(channel))
      throw new Error("Invalid request");

    if (code) {
      const { error } = await supabase.rpc("confirm_organization_verification", {
        p_organization_id: organizationId,
        p_channel: channel,
        p_code_hash: await sha256(`${organizationId}:${channel}:${code}`),
      });
      if (error) throw error;
      return Response.json({ ok: true }, { headers: corsHeaders });
    }

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("phone, email")
      .eq("id", organizationId)
      .single();
    if (orgError) throw orgError;
    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
    const { error: codeError } = await supabase.rpc("store_organization_verification_code", {
      p_organization_id: organizationId,
      p_channel: channel,
      p_code_hash: await sha256(`${organizationId}:${channel}:${verificationCode}`),
    });
    if (codeError) throw codeError;

    if (channel === "phone") {
      const apiKey = Deno.env.get("KAVENEGAR_API_KEY");
      if (!apiKey) throw new Error("KAVENEGAR_API_KEY is not configured");
      const params = new URLSearchParams({
        receptor: org.phone,
        message: `کد تأیید تأمینک: ${verificationCode}`,
      });
      const sms = await fetch(`https://api.kavenegar.com/v1/${apiKey}/sms/send.json`, {
        method: "POST",
        body: params,
      });
      if (!sms.ok) throw new Error("SMS delivery failed");
    } else {
      // Supabase Edge Functions need an email delivery provider. Configure RESEND_API_KEY and VERIFIED_FROM_EMAIL.
      const apiKey = Deno.env.get("RESEND_API_KEY");
      const from = Deno.env.get("VERIFIED_FROM_EMAIL");
      if (!apiKey || !from) throw new Error("Email delivery is not configured");
      const email = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [org.email],
          subject: "کد تأیید تأمینک",
          text: `کد تأیید شما: ${verificationCode}`,
        }),
      });
      if (!email.ok) throw new Error("Email delivery failed");
    }
    return Response.json({ ok: true }, { headers: corsHeaders });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 400, headers: corsHeaders },
    );
  }
});