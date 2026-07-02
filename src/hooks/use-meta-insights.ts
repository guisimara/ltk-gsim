import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { DateRange } from "react-day-picker";

export type MetaInsights = {
  spend: number;
  revenue: number;
  purchases: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  landing_page_views: number;
  cost_per_lp_view: number;
  initiate_checkouts: number;
  cost_per_ic: number;
};

export function useMetaInsights(
  actId: string | null | undefined,
  period: string,
  dateRange?: DateRange,
) {
  return useQuery({
    queryKey: ["meta-insights", actId, period, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    enabled: !!actId,
    staleTime: 60_000,
    retry: 1,
    queryFn: async (): Promise<MetaInsights> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const fmt = (d: Date) => d.toISOString().slice(0, 10);

      const body: Record<string, string> = { act_id: actId!, period };
      if (period === "custom" && dateRange?.from && dateRange?.to) {
        body.since = fmt(dateRange.from);
        body.until = fmt(dateRange.to);
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-insights`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json as MetaInsights;
    },
  });
}
