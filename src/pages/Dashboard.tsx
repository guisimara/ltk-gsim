import { useState } from "react";
import { PageHeader, PeriodSelector } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { AlertsBanner } from "@/components/AlertsBanner";
import { StatusPill } from "@/components/StatusPill";
import { aggregateAccount, trendPct, BENCHMARKS, classify } from "@/lib/aggregations";
import { computeAlerts } from "@/lib/alerts";
import { dailySeries } from "@/lib/seed";
import { fmtBRL, fmtInt, fmtPct, fmtX } from "@/lib/metrics";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ChevronRight } from "lucide-react";

export default function Dashboard() {
  const [period, setPeriod] = useState("7d");
  const agg = aggregateAccount();
  const alerts = computeAlerts();
  const prev = agg.previous;

  const stages = [
    { label: "Impressões", value: agg.totals.impressoes, fmt: fmtInt },
    { label: "Cliques no link", value: agg.totals.cliques, fmt: fmtInt },
    { label: "Visualizações da página", value: agg.totals.lpViews, fmt: fmtInt },
    { label: "Initiate Checkout", value: agg.totals.ic, fmt: fmtInt },
    { label: "Compras", value: agg.totals.compras, fmt: fmtInt },
  ];

  // taxas entre etapas + status
  const transitions = stages.slice(0, -1).map((s, i) => {
    const next = stages[i + 1];
    const rate = (next.value / s.value) * 100;
    const cost = agg.totals.gasto / next.value;
    let bench;
    if (i === 0) bench = BENCHMARKS.ctr_estatico;
    else if (i === 1) bench = BENCHMARKS.click_to_lp;
    else if (i === 2) bench = BENCHMARKS.lp_to_checkout;
    else bench = BENCHMARKS.checkout_to_purchase;
    return { from: s.label, to: next.label, rate, cost, status: classify(rate, bench), bench };
  });

  const worstIdx = transitions.reduce(
    (worst, t, i, arr) => (t.rate < arr[worst].rate ? i : worst),
    0,
  );

  const cpaStatus = agg.metrics.cpa < agg.cpaTeto ? "bom" : "ruim";

  return (
    <>
      <PageHeader
        title="Visão Geral"
        subtitle="Status da operação em tempo real — comparação vs período anterior"
        right={<PeriodSelector value={period} onChange={setPeriod} />}
      />

      <AlertsBanner alerts={alerts} />

      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Gasto"
          value={fmtBRL(agg.totals.gasto)}
          trend={trendPct(agg.totals.gasto, prev.gasto)}
        />
        <KpiCard
          label="Receita"
          value={fmtBRL(agg.totals.receita)}
          trend={trendPct(agg.totals.receita, prev.receita)}
        />
        <KpiCard
          label="Lucro Líquido"
          value={fmtBRL(agg.lucro.lucro)}
          status={agg.lucro.lucro > 0 ? "bom" : "ruim"}
          baseLabel={`margem ${agg.lucro.margem.toFixed(1)}%`}
          trend={trendPct(agg.lucro.lucro, prev.lucro)}
          highlight
        />
        <KpiCard
          label="ROAS"
          value={fmtX(agg.metrics.roas)}
          status={classify(agg.metrics.roas, BENCHMARKS.roas)}
          baseLabel={BENCHMARKS.roas.labels.bom}
          trend={trendPct(agg.metrics.roas, prev.roas)}
        />
        <KpiCard
          label="CPA"
          value={fmtBRL(agg.metrics.cpa)}
          status={cpaStatus}
          baseLabel={`teto ${fmtBRL(agg.cpaTeto)}`}
          trend={trendPct(agg.metrics.cpa, prev.cpa)}
          trendInvert
          microcopy={cpaStatus === "bom" ? "lucrando" : "no prejuízo"}
        />
        <KpiCard
          label="Vendas"
          value={fmtInt(agg.totals.compras)}
          trend={trendPct(agg.totals.compras, prev.compras)}
        />
        <KpiCard
          label="Ticket Médio (AOV)"
          value={fmtBRL(agg.metrics.aov)}
          status={classify(agg.metrics.aov, BENCHMARKS.aov)}
          baseLabel={BENCHMARKS.aov.labels.bom}
          trend={trendPct(agg.metrics.aov, prev.aov)}
        />
        <KpiCard
          label="CTR (link)"
          value={fmtPct(agg.metrics.ctrLink, 2)}
          status={classify(agg.metrics.ctrLink, BENCHMARKS.ctr_estatico)}
          baseLabel={BENCHMARKS.ctr_estatico.labels.bom}
        />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="card-surface p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Funil de Conversão</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Maior vazamento entre{" "}
                <span className="text-destructive font-medium">
                  {transitions[worstIdx].from} → {transitions[worstIdx].to}
                </span>{" "}
                ({transitions[worstIdx].rate.toFixed(1)}%)
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {stages.map((s, i) => {
              const t = transitions[i];
              const widthPct = (s.value / stages[0].value) * 100;
              return (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="num-tabular text-foreground font-medium">{s.fmt(s.value)}</span>
                  </div>
                  <div className="h-7 rounded-md bg-surface-elevated overflow-hidden">
                    <div
                      className="h-full bg-gradient-neon rounded-md transition-all"
                      style={{ width: `${widthPct}%`, opacity: 0.55 + (1 - i / stages.length) * 0.45 }}
                    />
                  </div>
                  {t && (
                    <div className="flex items-center gap-3 pl-3 mt-2 mb-1 text-xs">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="num-tabular text-foreground font-medium">
                        {t.rate.toFixed(1)}%
                      </span>
                      <span className="text-muted-foreground">conv.</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="num-tabular text-foreground">
                        {fmtBRL(t.cost)}
                      </span>
                      <span className="text-muted-foreground">por {t.to.toLowerCase()}</span>
                      <StatusPill status={t.status} className="ml-auto" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card-surface p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">Gasto × Receita</h2>
          <p className="text-xs text-muted-foreground mb-4">últimos 7 dias</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dailySeries}>
              <defs>
                <linearGradient id="gReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(204 100% 56%)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(204 100% 56%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gGasto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(219 13% 65%)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(219 13% 65%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--surface-elevated))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 10,
                  fontSize: 12,
                }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                formatter={(v: number) => fmtBRL(v)}
              />
              <Area type="monotone" dataKey="gasto" stroke="hsl(219 13% 65%)" fill="url(#gGasto)" strokeWidth={2} />
              <Area type="monotone" dataKey="receita" stroke="hsl(204 100% 56%)" fill="url(#gReceita)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
