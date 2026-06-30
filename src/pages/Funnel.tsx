import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { aggregateAccount, BENCHMARKS, classify } from "@/lib/aggregations";
import { fmtBRL, fmtInt, fmtPct } from "@/lib/metrics";
import { ads } from "@/lib/seed";
import { useState } from "react";

export default function Funnel() {
  const agg = aggregateAccount();
  const [campaignFilter, setCampaignFilter] = useState<string>("all");

  const campaigns = Array.from(new Set(ads.map((a) => a.campaign)));
  const filtered = ads.filter((a) => campaignFilter === "all" || a.campaign === campaignFilter);

  const t = filtered.reduce(
    (acc, x) => {
      acc.gasto += x.gasto;
      acc.impressoes += x.impressoes;
      acc.cliques += x.cliquesLink;
      acc.lpViews += x.lpViews;
      acc.ic += x.initiateCheckout;
      acc.compras += x.compras;
      return acc;
    },
    { gasto: 0, impressoes: 0, cliques: 0, lpViews: 0, ic: 0, compras: 0 },
  );

  const steps = [
    {
      from: "Impressões",
      to: "Cliques",
      fromV: t.impressoes,
      toV: t.cliques,
      rate: (t.cliques / t.impressoes) * 100,
      cost: t.gasto / t.cliques,
      bench: BENCHMARKS.ctr_estatico,
      unit: "%",
    },
    {
      from: "Cliques",
      to: "LP Views",
      fromV: t.cliques,
      toV: t.lpViews,
      rate: (t.lpViews / t.cliques) * 100,
      cost: t.gasto / t.lpViews,
      bench: BENCHMARKS.click_to_lp,
      unit: "%",
    },
    {
      from: "LP Views",
      to: "Initiate Checkout",
      fromV: t.lpViews,
      toV: t.ic,
      rate: (t.ic / t.lpViews) * 100,
      cost: t.gasto / t.ic,
      bench: BENCHMARKS.lp_to_checkout,
      unit: "%",
    },
    {
      from: "Initiate Checkout",
      to: "Compra",
      fromV: t.ic,
      toV: t.compras,
      rate: (t.compras / t.ic) * 100,
      cost: t.gasto / t.compras,
      bench: BENCHMARKS.checkout_to_purchase,
      unit: "%",
    },
  ];

  const worst = steps.reduce((w, s) => (s.rate < w.rate ? s : w), steps[0]);

  return (
    <>
      <PageHeader
        title="Funil Detalhado"
        subtitle={`O maior vazamento está entre ${worst.from} e ${worst.to} — ${worst.rate.toFixed(1)}%`}
        right={
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="all">Todas as campanhas</option>
            {campaigns.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        }
      />

      <div className="card-surface p-6">
        <div className="space-y-5">
          {steps.map((s, i) => {
            const status = classify(s.rate, s.bench);
            const isWorst = s === worst;
            return (
              <div
                key={i}
                className={`p-4 rounded-lg border transition-all ${
                  isWorst
                    ? "border-destructive/40 bg-destructive/5"
                    : "border-border bg-surface-elevated"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs label-caps">Transição</div>
                    <div className="text-sm font-medium text-foreground mt-0.5">
                      {s.from} → {s.to}
                    </div>
                  </div>
                  <StatusPill status={status} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Stat label={s.from} value={fmtInt(s.fromV)} />
                  <Stat label={s.to} value={fmtInt(s.toV)} />
                  <Stat label="Taxa de conversão" value={fmtPct(s.rate)} highlight />
                  <Stat label={`Custo por ${s.to.toLowerCase()}`} value={fmtBRL(s.cost)} />
                </div>
                <div className="text-[11px] text-muted-foreground mt-3">
                  base: {s.bench.labels.bom} · fórmula: {s.bench.formulaLabel}
                </div>
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
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`num-tabular text-lg font-semibold mt-0.5 ${highlight ? "text-primary" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}
