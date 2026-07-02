import React, { useState } from "react";
import { PageHeader, PeriodSelector } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { AlertsBanner } from "@/components/AlertsBanner";
import { StatusPill } from "@/components/StatusPill";
import { aggregateAccount, trendPct, BENCHMARKS, classify } from "@/lib/aggregations";
import { computeAlerts } from "@/lib/alerts";
import { bumps, productConfig, upsellConfig } from "@/lib/seed";
import { fmtBRL, fmtInt, fmtPct, fmtX, calcCpaTeto } from "@/lib/metrics";
import { SlidersHorizontal, Check, Wifi, GripVertical } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSelectedAccount } from "@/contexts/SelectedAccountContext";
import { useMetaInsights } from "@/hooks/use-meta-insights";
import type { DateRange } from "react-day-picker";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Definição de todas as métricas disponíveis ──────────────────────────────
const ALL_METRICS = [
  { id: "gasto",    label: "Gasto",                        info: "Total investido em anúncios no período." },
  { id: "receita",  label: "Receita",                      info: "Receita bruta gerada pelas vendas (front + bumps + upsell)." },
  { id: "lucro",    label: "Lucro Líquido",                info: "Receita menos gasto em anúncios." },
  { id: "roas",     label: "ROAS",                         info: "Return on Ad Spend — quanto recebe por R$1 investido." },
  { id: "cpa",      label: "CPA",                          info: "Custo Por Aquisição — quanto custa cada venda." },
  { id: "vendas",   label: "Vendas",                       info: "Quantidade total de compras confirmadas no período." },
  { id: "aov",      label: "Ticket Médio (AOV)",           info: "Average Order Value — valor médio por pedido." },
  { id: "ctr",      label: "CTR (link)",                   info: "Click-Through Rate — % de pessoas que clicaram no link do anúncio." },
  { id: "cpc",      label: "CPC (link)",                   info: "Custo Por Clique no link." },
  { id: "lp_views", label: "Visualizações de LP",          info: "Quantidade de visualizações da página de destino." },
  { id: "cpl",      label: "Custo por View de LP",         info: "Quanto custa cada visualização da página de destino." },
  { id: "ic",       label: "Initiate Checkout",            info: "Quantidade de pessoas que iniciaram o checkout." },
  { id: "cpic",     label: "Custo por Initiate Checkout",  info: "Quanto custa cada initiate checkout." },
];

const DEFAULT_VISIBLE = ALL_METRICS.map((m) => m.id);

export default function Dashboard() {
  const [period, setPeriod] = useState("7d");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [metricOrder, setMetricOrder] = useState<string[]>(DEFAULT_VISIBLE);
  const [visibleMetrics, setVisibleMetrics] = useState<string[]>(DEFAULT_VISIBLE);
  const [editOpen, setEditOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setMetricOrder((items) => {
        const oldIdx = items.indexOf(active.id as string);
        const newIdx = items.indexOf(over.id as string);
        return arrayMove(items, oldIdx, newIdx);
      });
    }
  }

  const toggleMetric = (id: string) => {
    setVisibleMetrics((v) => v.includes(id) ? v.filter((x) => x !== id) : [...v, id]);
    setMetricOrder((v) => v.includes(id) ? v : [...v, id]);
  };

  // Calculadora CPA-teto (estado local)
  const [calc, setCalc] = useState({
    precoLiquidoFront:
      productConfig.precoProdutoPrincipal *
      (1 - productConfig.taxaGatewayPercent / 100 - productConfig.impostoPercent / 100),
    takeRateBump: 0.30,
    valorMedioBumpLiquido:
      (bumps.reduce((s, b) => s + b.preco, 0) / bumps.length) *
      (1 - productConfig.taxaGatewayPercent / 100 - productConfig.impostoPercent / 100),
    takeRateUpsell: upsellConfig.taxaConversaoEstimadaPercent / 100,
    ltvLiquidoUpsell: upsellConfig.ltvLiquido,
    margemAlvo: productConfig.margemAlvo,
  });

  const { selectedAccount } = useSelectedAccount();
  const { data: insights, isLoading: insightsLoading } = useMetaInsights(
    selectedAccount?.act_id,
    period,
    dateRange,
  );
  const hasLiveData = !!insights && !insightsLoading;

  const agg = aggregateAccount();
  const prev = agg.previous;
  const cpaTeto = calcCpaTeto(calc);

  // Métricas reais do Meta (quando disponíveis)
  const liveSpend     = insights?.spend      ?? agg.totals.gasto;
  const liveRevenue   = insights?.revenue    ?? agg.totals.receita;
  const livePurchases = insights?.purchases  ?? agg.totals.compras;
  const liveCtr       = insights?.ctr        ?? agg.metrics.ctrLink;
  const liveCpc       = insights?.cpc        ?? agg.metrics.cpc;
  const liveLpViews   = insights?.landing_page_views ?? agg.totals.lpViews;
  const liveCpl       = insights?.cost_per_lp_view   ?? (liveLpViews > 0 ? liveSpend / liveLpViews : 0);
  const liveIc        = insights?.initiate_checkouts ?? agg.totals.ic;
  const liveCpIc      = insights?.cost_per_ic        ?? (liveIc > 0 ? liveSpend / liveIc : 0);
  const liveRoas      = liveSpend > 0 ? liveRevenue / liveSpend : agg.metrics.roas;
  const liveCpa       = livePurchases > 0 ? liveSpend / livePurchases : agg.metrics.cpa;
  const liveAov       = livePurchases > 0 ? liveRevenue / livePurchases : agg.metrics.aov;
  const liveLucro     = liveRevenue - liveSpend;
  const liveMargem    = liveRevenue > 0 ? (liveLucro / liveRevenue) * 100 : agg.lucro.margem;
  const liveCpaStatus = liveCpa < cpaTeto ? "bom" : "ruim";
  const lucrando = liveCpa < cpaTeto;

  // Alertas inteligentes baseados em dados reais
  const alerts = computeAlerts(hasLiveData ? {
    spend: liveSpend,
    revenue: liveRevenue,
    purchases: livePurchases,
    lpViews: liveLpViews,
    ic: liveIc,
    ctr: liveCtr,
    cpc: liveCpc,
    roas: liveRoas,
    cpa: liveCpa,
    cpaTeto,
  } : undefined);

  const cpaStatus = agg.metrics.cpa < agg.cpaTeto ? "bom" : "ruim";

  const show = (id: string) => visibleMetrics.includes(id);

  return (
    <>
      <PageHeader
        title="Visão Geral"
        subtitle="Status da operação em tempo real"
        right={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Editar Métricas */}
            <Popover open={editOpen} onOpenChange={setEditOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-all">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Editar Métricas
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-2">
                <p className="text-[10px] label-caps text-muted-foreground px-2 pt-1 pb-1">
                  Métricas visíveis
                </p>
                <p className="text-[10px] text-muted-foreground/60 px-2 pb-2 flex items-center gap-1">
                  <GripVertical className="h-3 w-3" />
                  Arraste os cards para reordenar
                </p>
                {ALL_METRICS.map((m) => {
                  const active = visibleMetrics.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleMetric(m.id)}
                      className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md hover:bg-surface-elevated transition-colors text-left"
                    >
                      <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${active ? "bg-primary border-primary" : "border-border"}`}>
                        {active && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                      </div>
                      <span className="text-xs text-foreground">{m.label}</span>
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>

            <PeriodSelector value={period} onChange={(v, range) => { setPeriod(v); if (range) setDateRange(range); }} />
          </div>
        }
      />

      <AlertsBanner alerts={alerts} />

      {/* Banner de dados ao vivo */}
      {selectedAccount && (
        <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg border text-xs transition-all ${
          insightsLoading
            ? "bg-surface-elevated border-border text-muted-foreground"
            : hasLiveData
              ? "bg-success/10 border-success/20 text-success"
              : "bg-warning/10 border-warning/20 text-warning"
        }`}>
          <Wifi className="h-3.5 w-3.5 shrink-0" />
          {insightsLoading ? (
            <span>Carregando dados de <strong>{selectedAccount.account_name}</strong>…</span>
          ) : hasLiveData ? (
            <span>
              Dados reais · <strong>{selectedAccount.account_name}</strong> ·{" "}
              {{ "3d": "últimos 3 dias", "7d": "últimos 7 dias", "30d": "últimos 30 dias", "custom": "período personalizado" }[period] ?? period}
            </span>
          ) : (
            <span>Sem dados no período selecionado para <strong>{selectedAccount.account_name}</strong></span>
          )}
        </div>
      )}

      {/* KPI Cards com DnD */}
      {(() => {
        const cardMap: Record<string, React.ReactNode> = {
          gasto:    <KpiCard label="Gasto"                  info="Total investido em anúncios no período."          value={fmtBRL(liveSpend)}     trend={hasLiveData ? undefined : trendPct(agg.totals.gasto, prev.gasto)} />,
          receita:  <KpiCard label="Receita"                info="Receita bruta gerada pelas vendas."               value={fmtBRL(liveRevenue)}   trend={hasLiveData ? undefined : trendPct(agg.totals.receita, prev.receita)} />,
          lucro:    <KpiCard label="Lucro Líquido"          info="Receita menos gasto em anúncios."                 value={fmtBRL(liveLucro)}     status={liveLucro > 0 ? "bom" : "ruim"} baseLabel={`margem ${liveMargem.toFixed(1)}%`} trend={hasLiveData ? undefined : trendPct(agg.lucro.lucro, prev.lucro)} highlight />,
          roas:     <KpiCard label="ROAS"                   info="Return on Ad Spend."                              value={fmtX(liveRoas)}        status={classify(liveRoas, BENCHMARKS.roas)} baseLabel={BENCHMARKS.roas.labels.bom} trend={hasLiveData ? undefined : trendPct(agg.metrics.roas, prev.roas)} />,
          cpa:      <KpiCard label="CPA"                    info="Custo Por Aquisição."                             value={fmtBRL(liveCpa)}       status={liveCpaStatus as "bom"|"ruim"} baseLabel={`teto ${fmtBRL(cpaTeto)}`} trend={hasLiveData ? undefined : trendPct(agg.metrics.cpa, prev.cpa)} trendInvert microcopy={liveCpaStatus === "bom" ? "lucrando" : "no prejuízo"} />,
          vendas:   <KpiCard label="Vendas"                 info="Compras confirmadas no período."                  value={fmtInt(livePurchases)} trend={hasLiveData ? undefined : trendPct(agg.totals.compras, prev.compras)} />,
          aov:      <KpiCard label="Ticket Médio (AOV)"     info="Valor médio por pedido."                          value={fmtBRL(liveAov)}       status={classify(liveAov, BENCHMARKS.aov)} baseLabel={BENCHMARKS.aov.labels.bom} trend={hasLiveData ? undefined : trendPct(agg.metrics.aov, prev.aov)} />,
          ctr:      <KpiCard label="CTR (link)"             info="% que clicaram no link do anúncio."               value={fmtPct(liveCtr, 2)}    status={classify(liveCtr, BENCHMARKS.ctr_estatico)} baseLabel={BENCHMARKS.ctr_estatico.labels.bom} />,
          cpc:      <KpiCard label="CPC (link)"             info="Custo por clique no link."                        value={fmtBRL(liveCpc)}       status={classify(liveCpc, BENCHMARKS.cpc)} baseLabel={BENCHMARKS.cpc.labels.bom} trendInvert />,
          lp_views: <KpiCard label="Views de LP"            info="Visualizações da página de destino."              value={fmtInt(liveLpViews)} />,
          cpl:      <KpiCard label="Custo/View LP"          info="Custo por visualização da página de destino."     value={fmtBRL(liveCpl)}       trendInvert />,
          ic:       <KpiCard label="Initiate Checkout"      info="Pessoas que iniciaram o checkout."                value={fmtInt(liveIc)} />,
          cpic:     <KpiCard label="Custo/IC"               info="Custo por initiate checkout."                     value={fmtBRL(liveCpIc)}      trendInvert />,
        };

        const visibleIds = metricOrder.filter(show);

        return (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visibleIds} strategy={rectSortingStrategy}>
              <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {visibleIds.map((id) => (
                  <DragCard key={id} id={id} editMode={editOpen}>
                    {cardMap[id]}
                  </DragCard>
                ))}
              </section>
            </SortableContext>
          </DndContext>
        );
      })()}

      {/* Painéis inferiores */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6">
        {/* Funil de Conversão */}
        <div className="card-surface p-4 sm:p-5 xl:col-span-2">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-foreground">Funil de Conversão</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasLiveData ? "Dados reais do Meta Ads" : "Dados simulados"}
            </p>
          </div>
          <div className="flex flex-col gap-0">
            {(() => {
              const funnelStages = [
                { label: "Cliques no link",   value: insights?.clicks ?? agg.totals.cliques },
                { label: "Visualizações LP",  value: liveLpViews },
                { label: "Initiate Checkout", value: liveIc },
                { label: "Compras",           value: livePurchases },
              ];
              const top = funnelStages[0].value || 1;
              return funnelStages.map((stage, i) => {
                const pct = (stage.value / top) * 100;
                const prevVal = i > 0 ? funnelStages[i - 1].value : null;
                const stepRate = prevVal && prevVal > 0 ? (stage.value / prevVal) * 100 : null;
                const isWorst = i > 0 && stepRate !== null && stepRate === Math.min(
                  ...funnelStages.slice(1).map((s, j) => funnelStages[j].value > 0 ? (s.value / funnelStages[j].value) * 100 : 100)
                );
                return (
                  <div key={stage.label}>
                    {/* Step conversion rate */}
                    {stepRate !== null && (
                      <div className="flex justify-center my-1">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isWorst ? "bg-destructive/15 text-destructive" : "bg-surface-elevated text-muted-foreground"}`}>
                          ↓ {stepRate.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {/* Funnel bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex justify-center">
                        <div
                          className="relative h-10 rounded-md flex items-center justify-center transition-all"
                          style={{
                            width: `${Math.max(pct, 8)}%`,
                            background: `hsl(var(--primary) / ${0.15 + (pct / 100) * 0.55})`,
                            border: `1px solid hsl(var(--primary) / ${0.2 + (pct / 100) * 0.4})`,
                          }}
                        >
                          <span className="text-[10px] font-semibold text-foreground num-tabular whitespace-nowrap px-2">{fmtInt(stage.value)}</span>
                        </div>
                      </div>
                      <div className="w-32 shrink-0 text-right">
                        <div className="text-[11px] text-foreground font-medium">{stage.label}</div>
                        <div className="text-[10px] text-muted-foreground num-tabular">{pct.toFixed(1)}% do topo</div>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Calculadora CPA-teto — 3 colunas */}
        <div className="card-surface p-4 sm:p-5 xl:col-span-3 card-active-glow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Calculadora de CPA-teto</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Edite os campos para simular cenários</p>
            </div>
            <StatusPill status={lucrando ? "bom" : "ruim"} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <CalcInput label="Preço líquido front (R$)" value={calc.precoLiquidoFront}
              onChange={(v) => setCalc({ ...calc, precoLiquidoFront: v })} />
            <CalcInput label="Take rate bump (%)" value={calc.takeRateBump * 100}
              onChange={(v) => setCalc({ ...calc, takeRateBump: v / 100 })} />
            <CalcInput label="Bump líquido (R$)" value={calc.valorMedioBumpLiquido}
              onChange={(v) => setCalc({ ...calc, valorMedioBumpLiquido: v })} />
            <CalcInput label="Take rate upsell (%)" value={calc.takeRateUpsell * 100}
              onChange={(v) => setCalc({ ...calc, takeRateUpsell: v / 100 })} />
            <CalcInput label="LTV líquido upsell (R$)" value={calc.ltvLiquidoUpsell}
              onChange={(v) => setCalc({ ...calc, ltvLiquidoUpsell: v })} />
            <CalcInput label="Margem alvo (%)" value={calc.margemAlvo * 100}
              onChange={(v) => setCalc({ ...calc, margemAlvo: v / 100 })} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="card-elevated p-3 rounded-xl">
              <div className="label-caps text-[10px]">CPA atual</div>
              <div className="text-xl font-semibold num-tabular text-foreground mt-1">{fmtBRL(agg.metrics.cpa)}</div>
            </div>
            <div className="card-elevated p-3 rounded-xl">
              <div className="label-caps text-[10px]">CPA-teto</div>
              <div className="text-xl font-semibold num-tabular neon-text mt-1">{fmtBRL(cpaTeto)}</div>
            </div>
          </div>

          <div className={`rounded-lg p-3 text-xs font-medium ${lucrando ? "bg-success/10 text-success border border-success/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
            {lucrando
              ? `✅ Operação lucrando — margem de R$${(cpaTeto - agg.metrics.cpa).toFixed(2)} por venda.`
              : `🔴 Operação no prejuízo — CPA R$${(agg.metrics.cpa - cpaTeto).toFixed(2)} acima do teto.`}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Drag wrapper simples ─────────────────────────────────────────────────────
function DragCard({ id, editMode, children }: { id: string; editMode: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : undefined,
      }}
      className="relative"
      {...(editMode ? { ...attributes, ...listeners } : {})}
    >
      {editMode && (
        <div
          className="absolute top-2 right-2 z-10 p-1 rounded bg-primary/10 border border-primary/30 cursor-grab active:cursor-grabbing pointer-events-none"
        >
          <GripVertical className="h-3.5 w-3.5 text-primary" />
        </div>
      )}
      <div className={editMode ? "cursor-grab active:cursor-grabbing ring-2 ring-primary/20 rounded-xl" : ""}>
        {children}
      </div>
    </div>
  );
}

function CalcInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="label-caps text-[10px] block mb-1">{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? +value.toFixed(2) : 0}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-surface-elevated border border-border rounded-md px-2.5 py-1.5 text-xs num-tabular text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </label>
  );
}
