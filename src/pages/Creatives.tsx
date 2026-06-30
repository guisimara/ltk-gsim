import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { ads as seedAds, type Ad } from "@/lib/seed";
import { BENCHMARKS, classify, fmtBRL, fmtPct } from "@/lib/metrics";
import { Flame, Image as ImageIcon, Video } from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS: Ad["status"][] = ["ativo", "pausado", "vencedor", "cortado"];

export default function Creatives() {
  const [filter, setFilter] = useState<"todos" | "estatico" | "video">("todos");
  const [ads, setAds] = useState<Ad[]>(seedAds);

  const list = ads.filter((a) => filter === "todos" || a.tipo === filter);

  const updateStatus = (id: string, status: Ad["status"]) => {
    setAds((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    toast.success(`Status atualizado para "${status}"`);
  };

  return (
    <>
      <PageHeader
        title="Criativos"
        subtitle="Bases de CTR diferentes para estático e vídeo — o filtro aplica a base correta"
        right={
          <div className="inline-flex items-center gap-1 p-1 rounded-lg border border-border bg-surface">
            {(["todos", "estatico", "video"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                  filter === f
                    ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.4)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "estatico" ? "Estáticos" : f === "video" ? "Vídeos" : "Todos"}
              </button>
            ))}
          </div>
        }
      />

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left font-medium px-4 py-3">Criativo</th>
                <th className="text-right font-medium px-3 py-3">Gasto</th>
                <th className="text-right font-medium px-3 py-3">CTR</th>
                <th className="text-right font-medium px-3 py-3">CPC</th>
                <th className="text-right font-medium px-3 py-3">Custo/IC</th>
                <th className="text-right font-medium px-3 py-3">CPA</th>
                <th className="text-right font-medium px-3 py-3">Freq.</th>
                <th className="text-right font-medium px-3 py-3">Hook 3s</th>
                <th className="text-right font-medium px-3 py-3">Retenção</th>
                <th className="text-center font-medium px-3 py-3">Fadiga</th>
                <th className="text-center font-medium px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((ad) => {
                const ctr = (ad.cliquesLink / ad.impressoes) * 100;
                const cpc = ad.gasto / ad.cliquesLink;
                const costIc = ad.gasto / ad.initiateCheckout;
                const cpa = ad.compras ? ad.gasto / ad.compras : Infinity;
                const freq = ad.impressoes / ad.alcance;
                const hook = ad.video3s ? (ad.video3s / ad.impressoes) * 100 : undefined;
                const ctrBench = ad.tipo === "video" ? BENCHMARKS.ctr_video : BENCHMARKS.ctr_estatico;
                const ctrStatus = classify(ctr, ctrBench);
                const cpcStatus = classify(cpc, BENCHMARKS.cpc);
                const costIcStatus = classify(costIc, BENCHMARKS.cost_per_ic);
                const cpaStatus = classify(cpa, BENCHMARKS.cpa);
                const freqStatus = classify(freq, BENCHMARKS.frequencia);
                const hookStatus = hook !== undefined ? classify(hook, BENCHMARKS.hook_rate) : undefined;
                const drop = ad.ctrPrev ? ((ad.ctrPrev - ctr) / ad.ctrPrev) * 100 : 0;
                const fadiga = freq > 2.5 && drop > 20;

                return (
                  <tr key={ad.id} className="border-b border-border last:border-0 hover:bg-surface-elevated transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-md bg-surface-elevated border border-border flex items-center justify-center shrink-0">
                          {ad.tipo === "video" ? (
                            <Video className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <ImageIcon className="h-3.5 w-3.5 text-primary-glow" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm text-foreground font-medium truncate max-w-[260px]">{ad.nome}</div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-[260px]">{ad.campaign}</div>
                        </div>
                      </div>
                    </td>
                    <Cell value={fmtBRL(ad.gasto)} />
                    <Cell value={fmtPct(ctr, 2)} status={ctrStatus} />
                    <Cell value={fmtBRL(cpc)} status={cpcStatus} />
                    <Cell value={fmtBRL(costIc)} status={costIcStatus} />
                    <Cell value={isFinite(cpa) ? fmtBRL(cpa) : "—"} status={isFinite(cpa) ? cpaStatus : undefined} />
                    <Cell value={`${freq.toFixed(2)}x`} status={freqStatus} />
                    <Cell value={hook !== undefined ? fmtPct(hook, 1) : "—"} status={hookStatus} />
                    <Cell value={ad.retencaoMedia !== undefined ? `${(ad.retencaoMedia * 100).toFixed(0)}%` : "—"} />
                    <td className="px-3 py-3 text-center">
                      {fadiga ? (
                        <span className="inline-flex items-center gap-1 text-destructive text-xs font-semibold">
                          <Flame className="h-3.5 w-3.5" /> Fadiga
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={ad.status}
                        onChange={(e) => updateStatus(ad.id, e.target.value as Ad["status"])}
                        className="bg-surface-elevated border border-border rounded-md text-xs text-foreground px-2 py-1 capitalize focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Cell({ value, status }: { value: string; status?: "bom" | "atencao" | "ruim" }) {
  return (
    <td className="px-3 py-3 text-right">
      <div className="inline-flex items-center gap-2 justify-end">
        <span className="num-tabular text-foreground">{value}</span>
        {status && <StatusPill status={status} />}
      </div>
    </td>
  );
}
