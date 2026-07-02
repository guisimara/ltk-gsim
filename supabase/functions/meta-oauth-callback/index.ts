import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function verifyState(state: string, secret: string): Promise<string | null> {
  try {
    const [payloadB64, sig] = state.split(".");
    if (!payloadB64 || !sig) return null;

    const payload = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));

    const keyBytes = new TextEncoder().encode(secret);
    const key = await crypto.subtle.importKey(
      "raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["verify"],
    );
    const sigBytes = Uint8Array.from(
      atob(sig.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0),
    );
    const valid = await crypto.subtle.verify(
      "HMAC", key, sigBytes, new TextEncoder().encode(payload),
    );
    if (!valid) return null;

    // payload = "userId:timestamp"
    const [userId, tsStr] = payload.split(":");
    const ts = parseInt(tsStr);
    // Expire after 10 minutes
    if (Date.now() - ts > 10 * 60 * 1000) return null;

    return userId;
  } catch {
    return null;
  }
}

async function encrypt(text: string, keyHex: string): Promise<string> {
  const keyBytes = new Uint8Array(keyHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const frontendUrl = Deno.env.get("FRONTEND_URL") ?? "http://localhost:5173";

  console.log("Callback received. code:", !!code, "state:", !!state, "error:", error);

  if (error) {
    return Response.redirect(`${frontendUrl}/integracoes?meta_error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return Response.redirect(`${frontendUrl}/integracoes?meta_error=missing_params`);
  }

  const secret = Deno.env.get("META_ENCRYPTION_KEY")!;
  const userId = await verifyState(state, secret);

  console.log("State verification result — userId:", userId);

  if (!userId) {
    return Response.redirect(`${frontendUrl}/integracoes?meta_error=invalid_state`);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const appId = Deno.env.get("META_APP_ID")!;
  const appSecret = Deno.env.get("META_APP_SECRET")!;
  const encKey = Deno.env.get("META_ENCRYPTION_KEY")!;
  const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/meta-oauth-callback`;

  // Exchange code for short-lived token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v25.0/oauth/access_token?` +
    `client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`,
  );
  const tokenData = await tokenRes.json();
  console.log("Token exchange result:", JSON.stringify(tokenData).slice(0, 100));

  if (!tokenData.access_token) {
    return Response.redirect(`${frontendUrl}/integracoes?meta_error=token_exchange_failed`);
  }

  const shortToken = tokenData.access_token;

  // Exchange for long-lived token (60 days)
  const llRes = await fetch(
    `https://graph.facebook.com/v25.0/oauth/access_token?` +
    `grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`,
  );
  const llData = await llRes.json();
  console.log("Long-lived token result:", JSON.stringify(llData).slice(0, 100));

  if (!llData.access_token) {
    return Response.redirect(`${frontendUrl}/integracoes?meta_error=longtoken_failed`);
  }

  const longToken = llData.access_token;
  const expiresIn = llData.expires_in ?? 5184000;
  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  // Get user info
  const meRes = await fetch(
    `https://graph.facebook.com/v25.0/me?fields=id,name&access_token=${longToken}`,
  );
  const meData = await meRes.json();
  console.log("Me data:", JSON.stringify(meData).slice(0, 100));

  const encryptedToken = await encrypt(longToken, encKey);

  // Delete existing connection for this user and insert fresh
  await supabase.from("fb_connections").delete().eq("user_id", userId);

  const { data: conn, error: connErr } = await supabase
    .from("fb_connections")
    .insert({
      user_id: userId,
      fb_user_id: meData.id,
      fb_user_name: meData.name ?? null,
      encrypted_token: encryptedToken,
      token_expires_at: tokenExpiresAt,
      scopes: ["business_management", "ads_read", "public_profile"],
      status: "active",
    })
    .select("id")
    .single();

  console.log("Connection save:", conn?.id, "error:", connErr?.message);

  if (connErr || !conn) {
    return Response.redirect(`${frontendUrl}/integracoes?meta_error=db_error`);
  }

  // Trigger initial sync (fire-and-forget)
  fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/meta-sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify({ connection_id: conn.id }),
  }).catch(console.error);

  return Response.redirect(`${frontendUrl}/integracoes?meta_connected=1`);
});
