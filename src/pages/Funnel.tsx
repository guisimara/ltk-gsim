import { useState } from "react";
import { PageHeader, PeriodSelector } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { BENCHMARKS, classify } from "@/lib/aggregations";
import { fmtBRL, fmtInt, fmtPct } from "@/lib/metrics";
import { useSelectedAccount } from "@/contexts/SelectedAccountContext";
import { useMetaInsights } from "@/hooks/use-meta-insights";
import type { DateRange } from "react-day-picker";
import { Wifi, TrendingDown } from "lucide-react";

export default function Funnel() {
  const [period, setPeriod] = useState("7d");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const { selectedAccount } = useSelectedAccount();
  const { data: insights, isLoading } = useMetaInsights(selectedAccount?.act_id, period, dateRange);

  const hasData = !!insights && !isLoading && insights.spend > 0;

  // Build funnel steps from real data
  const imp  = insights?.impressions         ?? 0;
  const clk  = insights?.clicks              ?? 0;
  const lpv  = insights?.landing_page_views  ?? 0;
  const ic   = insights?.initiate_checkouts  ?? 0;
  const pur  = insights?.purchases           ?? 0;
  const spend = insights?.spend              ?? 0;

  const steps = [
    {
      from: "Impressões",       fromV: imp,  to: "Cliques no link",   toV: clk,
      rate: imp > 0 ? (clk / imp) * 100 : 0,
      cost: clk > 0 ? spend / clk : 0,
      bench: BENCHMARKS.ctr_estatico,
      costLabel: "CPC",
    },
    {
      from: "Cliques no link",  fromV: clk,  to: "Visualizações LP",  toV: lpv,
      rate: clk > 0 ? (lpv / clk) * 100 : 0,
      cost: lpv > 0 ? spend / lpv : 0,
      bench: BENCHMARKS.click_to_lp,
      costLabel: "Custo/LP",
    },
    {
      from: "Visualizações LP", fromV: lpv,  to: "Initiate Checkout", toV: ic,
      rate: lpv > 0 ? (ic / lpv) * 100 : 0,
      cost: ic > 0 ? spend / ic : 0,
      bench: BENCHMARKS.lp_to_checkout,
      costLabel: "Custo/IC",
    },
    {
      from: "Initiate Checkout",fromV: ic,   to: "Compras",           toV: pur,
      rate: ic > 0 ? (pur / ic) * 100 : 0,
      cost: pur > 0 ? spend / pur : 0,
      bench: BENCHMARKS.checkout_to_purchase,
      costLabel: "CPA",
    },
  ];

  const worst = steps.reduce((w, s) => (s.rate < w.rate && s.fromV > 0 ? s : w), steps[0]);

  const subtitle = hasData
    ? `Gargalo: ${worst.from} → ${worst.to} com ${worst.rate.toFixed(1)}% de conversão`
    : selectedAccount ? "Selecione um período com dados ativos" : "Selecione uma conta para ver os dados";

  // Funnel stages for visual (sem Impressões)
  const funnelStages = [
    { label: "Cliques no link",   value: clk },
    { label: "Visualizações LP",  value: lpv },
    { label: "Initiate Checkout", value: ic  },
    { label: "Compras",           value: pur },
  ];
  const funnelTop = funnelStages[0].value || 1;

  return (
    <>
      <PageHeader
        title="Análise Detalhada do Funil"
        subtitle={subtitle}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <PeriodSelector
              value={period}
              onChange={(v, range) => { setPeriod(v); if (range) setDateRange(range); }}
            />
          </div>
        }
      />

      {/* Status banner */}
      {selectedAccount && (
        <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg border text-xs ${
          isLoading ? "bg-surface-elevated border-border text-muted-foreground"
          : hasData ? "bg-success/10 border-success/20 text-success"
          : "bg-warning/10 border-warning/20 text-warning"
        }`}>
          <Wifi className="h-3.5 w-3.5 shrink-0" />
          {isLoading ? `Carregando dados de ${selectedAccount.account_name}…`
            : hasData ? `Dados reais · ${selectedAccount.account_name}`
            : `Sem dados no período para ${selectedAccount.account_name}`}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6">
        {/* Visual Funnel */}
        <div className="card-surface p-4 sm:p-6 xl:col-span-2">
          <h2 className="text-base font-semibold text-foreground mb-5">Funil Visual</h2>
          <div className="flex flex-col gap-0">
            {funnelStages.map((stage, i) => {
              const pct = (stage.value / funnelTop) * 100;
              const prevVal = i > 0 ? funnelStages[i - 1].value : null;
              const stepRate = prevVal && prevVal > 0 ? (stage.value / prevVal) * 100 : null;
              const stepStatus = stepRate !== null ? classify(stepRate, steps[i - 1].bench) : null;
              return (
                <div key={stage.label}>
                  {stepRate !== null && (
                    <div className="flex justify-center my-1.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-0.5 rounded-full border ${
                        stepStatus === "ruim" ? "bg-destructive/15 text-destructive border-destructive/20" :
                        stepStatus === "atencao" ? "bg-warning/15 text-warning border-warning/20" :
                        "bg-success/15 text-success border-success/20"
                      }`}>
                        <TrendingDown className="h-2.5 w-2.5" />
                        {stepRate.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex justify-center">
                      <div
                        className="relative h-11 rounded-lg flex items-center justify-center"
                        style={{
                          width: `${Math.max(pct, 10)}%`,
                          background: `hsl(var(--primary) / ${0.12 + (pct / 100) * 0.5})`,
                          border: `1px solid hsl(var(--primary) / ${0.2 + (pct / 100) * 0.4})`,
                          minWidth: "60px",
                        }}
                      >
                        <span className="text-[11px] font-bold text-foreground num-tabular px-2 whitespace-nowrap">
                          {hasData ? fmtInt(stage.value) : "–"}
                        </span>
                      </div>
                    </div>
                    <div className="w-36 shrink-0">
                      <div className="text-xs text-foreground font-medium">{stage.label}</div>
                      <div className="text-[10px] text-muted-foreground num-tabular">{hasData ? `${pct.toFixed(1)}% do topo` : "—"}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step breakdown cards */}
        <div className="xl:col-span-3 space-y-3">
          {steps.map((s, i) => {
            const status = classify(s.rate, s.bench);
            const isWorstStep = hasData && s === worst && s.fromV > 0;
            return (
              <div
                key={i}
                className={`p-4 rounded-xl border transition-all ${
                  isWorstStep ? "border-destructive/40 bg-destructive/5" : "border-border bg-surface-elevated"
                }`}
              >
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] label-caps text-muted-foreground">Etapa {i + 1}</div>
                    <div className="text-sm font-medium text-foreground mt-0.5 truncate">
                      {s.from} → {s.to}
                      {isWorstStep && <span className="ml-2 text-[10px] text-destructive font-normal">● gargalo</span>}
                    </div>
                  </div>
                  {hasData && <StatusPill status={status} />}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Stat label={s.from}            value={hasData ? fmtInt(s.fromV) : "–"} />
                  <Stat label={s.to}              value={hasData ? fmtInt(s.toV)   : "–"} />
                  <Stat label="Taxa de conversão" value={hasData ? fmtPct(s.rate)  : "–"} highlight />
                  <Stat label={s.costLabel}       value={hasData ? fmtBRL(s.cost)  : "–"} />
                </div>
                {hasData && (
                  <div className="text-[10px] text-muted-foreground mt-3">
                    referência: {s.bench.labels.bom} · {s.bench.formulaLabel}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`num-tabular text-base sm:text-lg font-semibold mt-0.5 ${highlight ? "text-primary" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}
