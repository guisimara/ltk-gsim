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
    if (authErr || !user) return new Response("Unauthorized", { status: 401 });

    const body = await req.json();
    const { act_id, period, since, until } = body as {
      act_id: string;
      period: "3d" | "7d" | "30d" | "custom";
      since?: string;
      until?: string;
    };

    if (!act_id) {
      return new Response(JSON.stringify({ error: "act_id required" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Get user's active connection
    const { data: conn } = await supabase
      .from("fb_connections")
      .select("encrypted_token")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!conn) {
      return new Response(JSON.stringify({ error: "no_connection" }), {
        status: 404, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const encKey = Deno.env.get("META_ENCRYPTION_KEY")!;
    const token = await decrypt(conn.encrypted_token, encKey);

    // Build Meta API params
    const fields = "spend,impressions,clicks,reach,ctr,cpc,cpm,actions,action_values,cost_per_action_type";
    const url = new URL(`https://graph.facebook.com/v25.0/${act_id}/insights`);
    url.searchParams.set("fields", fields);
    url.searchParams.set("level", "account");
    url.searchParams.set("access_token", token);

    if (period === "custom" && since && until) {
      url.searchParams.set("time_range", JSON.stringify({ since, until }));
    } else {
      const presetMap: Record<string, string> = {
        "3d":  "last_3d",
        "7d":  "last_7d",
        "30d": "last_30d",
      };
      url.searchParams.set("date_preset", presetMap[period] ?? "last_7d");
    }

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.error) {
      console.error("Meta API error:", data.error);
      return new Response(JSON.stringify({ error: data.error.message }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const d = data.data?.[0];
    if (!d) {
      // No data for this period
      return new Response(JSON.stringify({
        spend: 0, revenue: 0, purchases: 0,
        impressions: 0, clicks: 0, ctr: 0, cpc: 0, cpm: 0,
      }), { headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const findAction = (arr: any[], types: string[]) =>
      arr?.find((a: any) => types.includes(a.action_type));

    const purchases   = findAction(d.actions ?? [], ["purchase", "offsite_conversion.fb_pixel_purchase"]);
    const revenue     = findAction(d.action_values ?? [], ["purchase", "offsite_conversion.fb_pixel_purchase"]);
    const lpViews     = findAction(d.actions ?? [], ["landing_page_view"]);
    const ic          = findAction(d.actions ?? [], ["initiate_checkout"]);
    const costPerLp   = findAction(d.cost_per_action_type ?? [], ["landing_page_view"]);
    const costPerIc   = findAction(d.cost_per_action_type ?? [], ["initiate_checkout"]);

    const spend = parseFloat(d.spend ?? "0");
    const lpViewsCount = parseInt(lpViews?.value ?? "0");
    const icCount      = parseInt(ic?.value ?? "0");

    const result = {
      spend,
      impressions:           parseInt(d.impressions ?? "0"),
      clicks:                parseInt(d.clicks      ?? "0"),
      reach:                 parseInt(d.reach       ?? "0"),
      ctr:                   parseFloat(d.ctr       ?? "0"),
      cpc:                   parseFloat(d.cpc       ?? "0"),
      cpm:                   parseFloat(d.cpm       ?? "0"),
      purchases:             parseInt(purchases?.value  ?? "0"),
      revenue:               parseFloat(revenue?.value  ?? "0"),
      landing_page_views:    lpViewsCount,
      cost_per_lp_view:      costPerLp ? parseFloat(costPerLp.value) : (lpViewsCount > 0 ? spend / lpViewsCount : 0),
      initiate_checkouts:    icCount,
      cost_per_ic:           costPerIc ? parseFloat(costPerIc.value) : (icCount > 0 ? spend / icCount : 0),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
