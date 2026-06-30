import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { ads } from "@/lib/seed";
import { BENCHMARKS, classify, fmtBRL, fmtInt, fmtX } from "@/lib/metrics";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Node {
  name: string;
  level: number;
  gasto: number;
  receita: number;
  compras: number;
  children?: Node[];
}

function aggregateNodes(): Node[] {
  const map = new Map<string, Map<string, typeof ads>>();
  ads.forEach((ad) => {
    if (!map.has(ad.campaign)) map.set(ad.campaign, new Map());
    const sets = map.get(ad.campaign)!;
    if (!sets.has(ad.adset)) sets.set(ad.adset, []);
    sets.get(ad.adset)!.push(ad);
  });

  return Array.from(map.entries()).map(([camp, sets]) => {
    const setNodes: Node[] = Array.from(sets.entries()).map(([set, list]) => {
      const adNodes: Node[] = list.map((a) => ({
        name: a.nome,
        level: 2,
        gasto: a.gasto,
        receita: a.receita,
        compras: a.compras,
      }));
      return {
        name: set,
        level: 1,
        gasto: adNodes.reduce((s, x) => s + x.gasto, 0),
        receita: adNodes.reduce((s, x) => s + x.receita, 0),
        compras: adNodes.reduce((s, x) => s + x.compras, 0),
        children: adNodes,
      };
    });
    return {
      name: camp,
      level: 0,
      gasto: setNodes.reduce((s, x) => s + x.gasto, 0),
      receita: setNodes.reduce((s, x) => s + x.receita, 0),
      compras: setNodes.reduce((s, x) => s + x.compras, 0),
      children: setNodes,
    };
  });
}

export default function Campaigns() {
  const tree = aggregateNodes();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  return (
    <>
      <PageHeader
        title="Campanhas"
        subtitle="Hierarquia Campanha → Conjunto → Anúncio com métricas agregadas e status"
      />

      <div className="card-surface overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-3 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
          <div className="col-span-5">Nome</div>
          <div className="col-span-2 text-right">Gasto</div>
          <div className="col-span-2 text-right">Receita</div>
          <div className="col-span-1 text-right">Vendas</div>
          <div className="col-span-1 text-right">ROAS</div>
          <div className="col-span-1 text-right">CPA</div>
        </div>

        {tree.map((c, ci) => {
          const cKey = `c${ci}`;
          const cRoas = c.receita / c.gasto;
          const cCpa = c.compras ? c.gasto / c.compras : 0;
          const cOpen = open[cKey] ?? true;
          return (
            <div key={cKey}>
              <Row
                open={cOpen}
                onToggle={() => toggle(cKey)}
                level={0}
                name={c.name}
                gasto={c.gasto}
                receita={c.receita}
                compras={c.compras}
                roas={cRoas}
                cpa={cCpa}
              />
              {cOpen &&
                c.children?.map((s, si) => {
                  const sKey = `${cKey}.s${si}`;
                  const sRoas = s.receita / s.gasto;
                  const sCpa = s.compras ? s.gasto / s.compras : 0;
                  const sOpen = open[sKey];
                  return (
                    <div key={sKey}>
                      <Row
                        open={sOpen}
                        onToggle={() => toggle(sKey)}
                        level={1}
                        name={s.name}
                        gasto={s.gasto}
                        receita={s.receita}
                        compras={s.compras}
                        roas={sRoas}
                        cpa={sCpa}
                      />
                      {sOpen &&
                        s.children?.map((a, ai) => (
                          <Row
                            key={`${sKey}.a${ai}`}
                            level={2}
                            name={a.name}
                            gasto={a.gasto}
                            receita={a.receita}
                            compras={a.compras}
                            roas={a.receita / a.gasto}
                            cpa={a.compras ? a.gasto / a.compras : 0}
                          />
                        ))}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </>
  );
}

function Row({
  name,
  level,
  gasto,
  receita,
  compras,
  roas,
  cpa,
  open,
  onToggle,
}: {
  name: string;
  level: 0 | 1 | 2;
  gasto: number;
  receita: number;
  compras: number;
  roas: number;
  cpa: number;
  open?: boolean;
  onToggle?: () => void;
}) {
  const pad = level === 0 ? "pl-4" : level === 1 ? "pl-10" : "pl-16";
  const roasStatus = classify(roas, BENCHMARKS.roas);
  const cpaStatus = classify(cpa, BENCHMARKS.cpa);
  const expandable = level < 2;
  return (
    <div
      className={`grid grid-cols-12 items-center py-3 pr-4 border-b border-border last:border-0 text-sm ${
        level === 0 ? "bg-surface-elevated/40" : ""
      } hover:bg-surface-elevated transition-colors`}
    >
      <div className={`col-span-5 ${pad} flex items-center gap-2 min-w-0`}>
        {expandable ? (
          <button onClick={onToggle} className="text-muted-foreground hover:text-foreground shrink-0">
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <span className={`truncate ${level === 0 ? "font-semibold text-foreground" : level === 1 ? "text-foreground" : "text-muted-foreground"}`}>
          {name}
        </span>
      </div>
      <div className="col-span-2 text-right num-tabular text-foreground">{fmtBRL(gasto)}</div>
      <div className="col-span-2 text-right num-tabular text-foreground">{fmtBRL(receita)}</div>
      <div className="col-span-1 text-right num-tabular text-foreground">{fmtInt(compras)}</div>
      <div className="col-span-1 text-right num-tabular">
        <span className="inline-flex items-center gap-1.5 justify-end">
          {fmtX(roas)}
          <StatusPill status={roasStatus} />
        </span>
      </div>
      <div className="col-span-1 text-right num-tabular">
        <span className="inline-flex items-center gap-1.5 justify-end">
          {fmtBRL(cpa)}
          <StatusPill status={cpaStatus} />
        </span>
      </div>
    </div>
  );
}
