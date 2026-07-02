import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type FbConnection = {
  id: string;
  fb_user_id: string;
  fb_user_name: string | null;
  token_expires_at: string;
  status: "active" | "expired" | "error" | "disconnected";
  last_synced_at: string | null;
};

export type BusinessManager = {
  id: string;
  bm_id: string;
  bm_name: string;
  profile_picture_uri: string | null;
};

export type AdAccount = {
  id: string;
  bm_db_id: string;
  act_id: string;
  account_name: string;
  account_status: number;
  currency: string;
  timezone_name: string | null;
  sync_enabled: boolean;
  last_insights: Record<string, any> | null;
  last_synced_at: string | null;
};

export function useMetaConnection() {
  return useQuery({
    queryKey: ["meta-connection"],
    queryFn: async () => {
      const { data: conn } = await supabase
        .from("fb_connections")
        .select("*")
        .eq("status", "active")
        .maybeSingle();

      if (!conn) return { connection: null, bms: [], accounts: [] };

      const { data: bms } = await supabase
        .from("business_managers")
        .select("*")
        .eq("connection_id", conn.id);

      const bmIds = (bms ?? []).map((bm: BusinessManager) => bm.id);
      const { data: accounts } = bmIds.length
        ? await supabase.from("ad_accounts").select("*").in("bm_db_id", bmIds)
        : { data: [] };

      return {
        connection: conn as FbConnection,
        bms: (bms ?? []) as BusinessManager[],
        accounts: (accounts ?? []) as AdAccount[],
      };
    },
    staleTime: 30_000,
  });
}

export function useConnectMeta() {
  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-oauth-start`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      );
      const json = await res.json();
      if (!json.url) throw new Error("Falha ao iniciar OAuth");
      window.location.href = json.url;
    },
  });
}

export function useDisconnectMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (connectionId: string) => {
      await supabase
        .from("fb_connections")
        .update({ status: "disconnected" })
        .eq("id", connectionId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meta-connection"] }),
  });
}

export function useToggleAccountSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, enabled }: { accountId: string; enabled: boolean }) => {
      await supabase.from("ad_accounts").update({ sync_enabled: enabled }).eq("id", accountId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meta-connection"] }),
  });
}

export function useTriggerSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-sync`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ connection_id: connectionId }),
        },
      );
    },
    onSuccess: () => {
      setTimeout(() => qc.invalidateQueries({ queryKey: ["meta-connection"] }), 3000);
    },
  });
}
