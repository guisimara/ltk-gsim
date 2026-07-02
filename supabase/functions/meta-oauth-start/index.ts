import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function signState(payload: string, secret: string): Promise<string> {
  const keyBytes = new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !user) {
      console.error("Auth error:", authErr);
      return new Response("Unauthorized", { status: 401 });
    }

    // Build signed state: base64(userId + timestamp) + . + HMAC signature
    const secret = Deno.env.get("META_ENCRYPTION_KEY")!;
    const payload = `${user.id}:${Date.now()}`;
    const payloadB64 = btoa(payload).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    const sig = await signState(payload, secret);
    const state = `${payloadB64}.${sig}`;

    const appId = Deno.env.get("META_APP_ID")!;
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/meta-oauth-callback`;
    const scopes = ["business_management", "ads_read", "public_profile"].join(",");

    const fbUrl = new URL("https://www.facebook.com/v25.0/dialog/oauth");
    fbUrl.searchParams.set("client_id", appId);
    fbUrl.searchParams.set("redirect_uri", redirectUri);
    fbUrl.searchParams.set("state", state);
    fbUrl.searchParams.set("scope", scopes);
    fbUrl.searchParams.set("response_type", "code");

    console.log("OAuth URL generated for user:", user.id);

    return new Response(JSON.stringify({ url: fbUrl.toString() }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
