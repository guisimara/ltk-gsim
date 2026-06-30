import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { aggregateAccount, BENCHMARKS, classify } from "@/lib/aggregations";
import { bumps, productConfig, upsellConfig } from "@/lib/seed";
import { calcCpaTeto, fmtBRL, fmtPct } from "@/lib/metrics";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ["hsl(204 100% 56%)", "hsl(192 100% 62%)", "hsl(153 65% 49%)"];

export default function Financial() {
  const agg = aggregateAccount();
  const [calc, setCalc] = useState({
    precoLiquidoFront:
      productConfig.precoProdutoPrincipal *
      (1 - productConfig.taxaGatewayPercent / 100 - productConfig.impostoPercent / 100),
    takeRateBump: agg.bumpStats.avgTake,
    valorMedioBumpLiquido:
      agg.bumpStats.avgPreco *
      (1 - productConfig.taxaGatewayPercent / 100 - productConfig.impostoPercent / 100),
    takeRateUpsell: upsellConfig.taxaConversaoEstimadaPercent / 100,
    ltvLiquidoUpsell: upsellConfig.ltvLiquido,
    margemAlvo: productConfig.margemAlvo,
  });

  const cpaTeto = calcCpaTeto(calc);
  const cpaAtual = agg.metrics.cpa;
  const lucrando = cpaAtual < cpaTeto;

  const aovStatus = classify(agg.metrics.aov, BENCHMARKS.aov);
  const upsellStatus = classify(upsellConfig.taxaConversaoEstimadaPercent, BENCHMARKS.upsell_take);

  const pieData = [
    { name: "Produto Principal", value: Math.max(0, agg.receitaBreakdown.front) },
    { name: "Order Bumps", value: agg.receitaBreakdown.bumps },
    { name: "Upsell (estimado)", value: agg.receitaBreakdown.upsell },
  ];

  return (
    <>
      <PageHeader
        title="Financeiro & Lucro"
        subtitle="A decisão de escala vive aqui — CPA-teto, take rates e lucro líquido real"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card-surface p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground mb-1">Quebra de Receita</h2>
          <p className="text-xs text-muted-foreground mb-4">Front × Bump × Upsell</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} innerRadius={60} stroke="hsl(var(--background))">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--surface-elevated))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 10,
                  fontSize: 12,
                }}
                formatter={(v: number) => fmtBRL(v)}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card-surface p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">Lucro Líquido</h2>
          <p className="text-xs text-muted-foreground mb-4">Receita − Ads − Gateway − Imposto − Custo</p>
          <div className="space-y-3">
            <Line label="Receita total" value={fmtBRL(agg.totals.receita)} />
            <Line label="Gasto em ads" value={`− ${fmtBRL(agg.totals.gasto)}`} dim />
            <Line label="Taxas gateway" value={`− ${fmtBRL(agg.lucro.taxasGateway)}`} dim />
            <Line label="Imposto" value={`− ${fmtBRL(agg.lucro.imposto)}`} dim />
            <div className="border-t border-border pt-3 mt-3">
              <div className="flex items-end justify-between">
                <span className="label-caps">Lucro Líquido</span>
                <StatusPill status={agg.lucro.lucro > 0 ? "bom" : "ruim"} />
              </div>
              <div className="text-3xl font-semibold neon-text num-tabular mt-1">
                {fmtBRL(agg.lucro.lucro)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">margem {agg.lucro.margem.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card-surface p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">AOV & Take Rates</h2>
          <div className="space-y-4">
            <RowStat
              label="AOV (Ticket Médio)"
              value={fmtBRL(agg.metrics.aov)}
              status={aovStatus}
              base={BENCHMARKS.aov.labels.bom}
            />
            {bumps.map((b) => {
              const st = classify(b.takeRate * 100, BENCHMARKS.bump_take);
              return (
                <RowStat
                  key={b.id}
                  label={`Bump · ${b.nome}`}
                  value={fmtPct(b.takeRate * 100)}
                  status={st}
                  base={BENCHMARKS.bump_take.labels.bom}
                />
              );
            })}
            <RowStat
              label={`Upsell · ${upsellConfig.nome}`}
              value={fmtPct(upsellConfig.taxaConversaoEstimadaPercent)}
              status={upsellStatus}
              base={BENCHMARKS.upsell_take.labels.bom}
            />
          </div>
        </div>

        <div className="card-surface p-6 card-active-glow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Calculadora de CPA-teto</h2>
            <StatusPill status={lucrando ? "bom" : "ruim"} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <Input label="Preço líquido front (R$)" value={calc.precoLiquidoFront} onChange={(v) => setCalc({ ...calc, precoLiquidoFront: v })} />
            <Input label="Take rate bump (%)" value={calc.takeRateBump * 100} onChange={(v) => setCalc({ ...calc, takeRateBump: v / 100 })} />
            <Input label="Bump líquido (R$)" value={calc.valorMedioBumpLiquido} onChange={(v) => setCalc({ ...calc, valorMedioBumpLiquido: v })} />
            <Input label="Take rate upsell (%)" value={calc.takeRateUpsell * 100} onChange={(v) => setCalc({ ...calc, takeRateUpsell: v / 100 })} />
            <Input label="LTV líquido upsell (R$)" value={calc.ltvLiquidoUpsell} onChange={(v) => setCalc({ ...calc, ltvLiquidoUpsell: v })} />
            <Input label="Margem alvo (%)" value={calc.margemAlvo * 100} onChange={(v) => setCalc({ ...calc, margemAlvo: v / 100 })} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="card-elevated p-3">
              <div className="label-caps">CPA atual</div>
              <div className="text-2xl font-semibold num-tabular text-foreground mt-1">{fmtBRL(cpaAtual)}</div>
            </div>
            <div className="card-elevated p-3">
              <div className="label-caps">CPA-teto</div>
              <div className="text-2xl font-semibold num-tabular neon-text mt-1">{fmtBRL(cpaTeto)}</div>
            </div>
          </div>

          <div className={`rounded-lg p-3 text-sm font-medium ${lucrando ? "bg-success/10 text-success border border-success/30" : "bg-destructive/10 text-destructive border border-destructive/30"}`}>
            {lucrando
              ? `🟢 Operação lucrando — margem de R$${(cpaTeto - cpaAtual).toFixed(2)} por venda.`
              : `🔴 Operação no prejuízo — CPA R$${(cpaAtual - cpaTeto).toFixed(2)} acima do teto.`}
          </div>
        </div>
      </div>
    </>
  );
}

function Line({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`num-tabular ${dim ? "text-muted-foreground" : "text-foreground font-medium"}`}>{value}</span>
    </div>
  );
}

function RowStat({ label, value, status, base }: { label: string; value: string; status: "bom" | "atencao" | "ruim"; base: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-foreground">{label}</div>
        <div className="text-[11px] text-muted-foreground">base: {base}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className="num-tabular text-foreground font-medium">{value}</span>
        <StatusPill status={status} />
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="label-caps block mb-1.5">{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value.toFixed(2) : 0}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-surface-elevated border border-border rounded-md px-3 py-2 text-sm num-tabular text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </label>
  );
}
