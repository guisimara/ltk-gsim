import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function decrypt(encB64: string, keyHex: string): Promise<string> {
  const keyBytes = new Uint8Array(keyHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["decrypt"]);
  const combined = Uint8Array.from(atob(encB64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plain);
}

async function graphGet(path: string, token: string, params: Record<string, string> = {}) {
  const url = new URL(`https://graph.facebook.com/v25.0${path}`);
  url.searchParams.set("access_token", token);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());

  // Rate limiting: check header
  const usageHeader = res.headers.get("X-Business-Use-Case-Usage");
  if (usageHeader) {
    try {
      const usage = JSON.parse(usageHeader);
      for (const calls of Object.values(usage) as any[]) {
        for (const call of calls) {
          if (call.estimated_time_to_regain_access > 0) {
            await new Promise((r) => setTimeout(r, call.estimated_time_to_regain_access * 1000));
          }
        }
      }
    } catch (_) { /* ignore */ }
  }

  const data = await res.json();

  // Rate limit errors: back off and retry once
  if (data.error?.code === 17 || data.error?.code === 80000 || data.error?.code === 80003) {
    await new Promise((r) => setTimeout(r, 60_000));
    const res2 = await fetch(url.toString());
    return res2.json();
  }

  return data;
}

async function paginateAll(firstUrl: string, token: string): Promise<any[]> {
  const items: any[] = [];
  let nextUrl: string | null = firstUrl;

  while (nextUrl) {
    const sep = nextUrl.includes("?") ? "&" : "?";
    const res = await fetch(`${nextUrl}${sep}access_token=${token}`);
    const data = await res.json();
    if (data.data) items.push(...data.data);
    nextUrl = data.paging?.next ?? null;
    if (items.length > 500) break; // safety cap
  }

  return items;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const body = await req.json().catch(() => ({}));
    const connectionId: string | undefined = body.connection_id;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const encKey = Deno.env.get("META_ENCRYPTION_KEY")!;

    // Fetch connections to sync
    let query = supabase.from("fb_connections").select("*").eq("status", "active");
    if (connectionId) query = query.eq("id", connectionId);
    const { data: connections, error: connErr } = await query;

    console.log("Connections found:", connections?.length, "error:", connErr?.message, "connectionId:", connectionId);

    if (connErr || !connections?.length) {
      return new Response(JSON.stringify({ ok: true, synced: 0, error: connErr?.message }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    for (const conn of connections) {
      try {
        const token = await decrypt(conn.encrypted_token, encKey);

        // 1. Fetch Business Managers
        const bmsData = await graphGet("/me/businesses", token, {
          fields: "id,name,profile_picture_uri",
          limit: "100",
        });

        const bms: any[] = bmsData.data ?? [];

        // Upsert BMs
        if (bms.length) {
          await supabase.from("business_managers").upsert(
            bms.map((bm: any) => ({
              connection_id: conn.id,
              bm_id: bm.id,
              bm_name: bm.name,
              profile_picture_uri: bm.profile_picture_uri ?? null,
            })),
            { onConflict: "connection_id,bm_id" },
          );
        }

        // 2. Fetch ad accounts for each BM
        const datePreset = "last_30d";
        const insightFields = "spend,impressions,reach,cpm,ctr,cpc,clicks,actions,action_values";

        for (const bm of bms) {
          // Owned accounts
          const ownedUrl = `https://graph.facebook.com/v25.0/${bm.id}/owned_ad_accounts?fields=id,name,account_status,currency,timezone_name&limit=100`;
          const clientUrl = `https://graph.facebook.com/v25.0/${bm.id}/client_ad_accounts?fields=id,name,account_status,currency,timezone_name&limit=100`;

          const [ownedAccs, clientAccs] = await Promise.all([
            paginateAll(ownedUrl, token),
            paginateAll(clientUrl, token),
          ]);

          const allAccs = [...ownedAccs, ...clientAccs];
          const seen = new Set<string>();
          const uniqueAccs = allAccs.filter((a) => {
            if (seen.has(a.id)) return false;
            seen.add(a.id);
            return true;
          });

          if (!uniqueAccs.length) continue;

          // Get BM row id
          const { data: bmRow } = await supabase
            .from("business_managers")
            .select("id")
            .eq("connection_id", conn.id)
            .eq("bm_id", bm.id)
            .single();

          if (!bmRow) continue;

          // Upsert ad accounts
          await supabase.from("ad_accounts").upsert(
            uniqueAccs.map((acc: any) => ({
              bm_db_id: bmRow.id,
              act_id: acc.id, // e.g. "act_123456"
              account_name: acc.name,
              account_status: acc.account_status,
              currency: acc.currency ?? "BRL",
              timezone_name: acc.timezone_name ?? null,
            })),
            { onConflict: "bm_db_id,act_id" },
          );

          // 3. Fetch insights for each enabled account
          const { data: enabledAccounts } = await supabase
            .from("ad_accounts")
            .select("id,act_id")
            .eq("bm_db_id", bmRow.id)
            .eq("sync_enabled", true);

          for (const acc of enabledAccounts ?? []) {
            const insights = await graphGet(`/${acc.act_id}/insights`, token, {
              fields: insightFields,
              date_preset: datePreset,
              level: "account",
            });

            if (insights.data?.[0]) {
              const d = insights.data[0];
              const purchases = (d.actions ?? []).find((a: any) => a.action_type === "purchase");
              const revenue = (d.action_values ?? []).find((a: any) => a.action_type === "purchase");

              await supabase.from("ad_accounts").update({
                last_insights: {
                  spend: parseFloat(d.spend ?? "0"),
                  impressions: parseInt(d.impressions ?? "0"),
                  reach: parseInt(d.reach ?? "0"),
                  cpm: parseFloat(d.cpm ?? "0"),
                  ctr: parseFloat(d.ctr ?? "0"),
                  cpc: parseFloat(d.cpc ?? "0"),
                  clicks: parseInt(d.clicks ?? "0"),
                  purchases: parseInt(purchases?.value ?? "0"),
                  revenue: parseFloat(revenue?.value ?? "0"),
                  date_preset: datePreset,
                  synced_at: new Date().toISOString(),
                },
                last_synced_at: new Date().toISOString(),
              }).eq("id", acc.id);
            }
          }
        }

        // Update connection last_synced_at
        await supabase
          .from("fb_connections")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("id", conn.id);

      } catch (connSyncErr) {
        console.error(`Error syncing connection ${conn.id}:`, connSyncErr);
        await supabase.from("fb_connections").update({ status: "error" }).eq("id", conn.id);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, synced: connections.length }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
