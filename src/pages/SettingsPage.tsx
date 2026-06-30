import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { productConfig as seedProd, bumps as seedBumps, upsellConfig as seedUp } from "@/lib/seed";
import { BENCHMARKS } from "@/lib/metrics";
import { toast } from "sonner";
import { Save, Plus, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const [prod, setProd] = useState(seedProd);
  const [bumps, setBumps] = useState(seedBumps);
  const [ups, setUps] = useState(seedUp);

  const save = (label: string) => toast.success(`${label} salvas com sucesso`);

  return (
    <>
      <PageHeader title="Configurações" subtitle="Produto, bumps, upsell e benchmarks editáveis" />

      <section className="card-surface p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Produto principal</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Preço (R$)" value={prod.precoProdutoPrincipal} onChange={(v) => setProd({ ...prod, precoProdutoPrincipal: v })} />
          <Field label="Taxa gateway (%)" value={prod.taxaGatewayPercent} onChange={(v) => setProd({ ...prod, taxaGatewayPercent: v })} />
          <Field label="Taxa gateway fixa (R$)" value={prod.taxaGatewayFixa} onChange={(v) => setProd({ ...prod, taxaGatewayFixa: v })} />
          <Field label="Imposto (%)" value={prod.impostoPercent} onChange={(v) => setProd({ ...prod, impostoPercent: v })} />
          <Field label="Custo do produto (R$)" value={prod.custoProduto} onChange={(v) => setProd({ ...prod, custoProduto: v })} />
          <Field label="Margem alvo (0–1)" value={prod.margemAlvo} step={0.05} onChange={(v) => setProd({ ...prod, margemAlvo: v })} />
        </div>
        <SaveBtn onClick={() => save("Configurações de produto")} />
      </section>

      <section className="card-surface p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Order Bumps</h2>
          <button
            onClick={() => setBumps([...bumps, { id: `b${Date.now()}`, nome: "Novo bump", preco: 0, takeRate: 0 }])}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-glow"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </button>
        </div>
        <div className="space-y-3">
          {bumps.map((b, i) => (
            <div key={b.id} className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-5">
                <span className="label-caps block mb-1.5">Nome</span>
                <input
                  value={b.nome}
                  onChange={(e) => {
                    const copy = [...bumps];
                    copy[i] = { ...b, nome: e.target.value };
                    setBumps(copy);
                  }}
                  className="w-full bg-surface-elevated border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="col-span-3">
                <Field label="Preço (R$)" value={b.preco} onChange={(v) => { const c = [...bumps]; c[i] = { ...b, preco: v }; setBumps(c); }} />
              </div>
              <div className="col-span-3">
                <Field label="Take rate (0–1)" step={0.01} value={b.takeRate} onChange={(v) => { const c = [...bumps]; c[i] = { ...b, takeRate: v }; setBumps(c); }} />
              </div>
              <button
                onClick={() => setBumps(bumps.filter((x) => x.id !== b.id))}
                className="col-span-1 h-10 inline-flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Remover"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <SaveBtn onClick={() => save("Order bumps")} />
      </section>

      <section className="card-surface p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Upsell</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2 md:col-span-1">
            <span className="label-caps block mb-1.5">Nome</span>
            <input value={ups.nome} onChange={(e) => setUps({ ...ups, nome: e.target.value })} className="w-full bg-surface-elevated border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <Field label="Preço (R$)" value={ups.preco} onChange={(v) => setUps({ ...ups, preco: v })} />
          <Field label="Conv. estimada (%)" value={ups.taxaConversaoEstimadaPercent} onChange={(v) => setUps({ ...ups, taxaConversaoEstimadaPercent: v })} />
          <Field label="LTV líquido (R$)" value={ups.ltvLiquido} onChange={(v) => setUps({ ...ups, ltvLiquido: v })} />
        </div>
        <SaveBtn onClick={() => save("Configurações de upsell")} />
      </section>

      <section className="card-surface p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">Benchmarks</h2>
        <p className="text-xs text-muted-foreground mb-4">Faixas usadas pelo motor de status. Pré-populadas com bases low-ticket BR.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left font-medium px-3 py-2">Métrica</th>
                <th className="text-left font-medium px-3 py-2">Fórmula</th>
                <th className="text-left font-medium px-3 py-2">Bom</th>
                <th className="text-left font-medium px-3 py-2">Atenção</th>
                <th className="text-left font-medium px-3 py-2">Ruim</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(BENCHMARKS).map((b) => (
                <tr key={b.metric} className="border-b border-border last:border-0">
                  <td className="px-3 py-2.5 text-foreground">{b.metric}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{b.formulaLabel}</td>
                  <td className="px-3 py-2.5 text-success">{b.labels.bom}</td>
                  <td className="px-3 py-2.5 text-warning">{b.labels.atencao}</td>
                  <td className="px-3 py-2.5 text-destructive">{b.labels.ruim}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Field({ label, value, onChange, step = 0.01 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="block">
      <span className="label-caps block mb-1.5">{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-surface-elevated border border-border rounded-md px-3 py-2 text-sm num-tabular text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </label>
  );
}

function SaveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-5 inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary-glow shadow-neon transition-colors"
    >
      <Save className="h-4 w-4" /> Salvar
    </button>
  );
}
