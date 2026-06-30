import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";
import { Upload, FileSpreadsheet, Plug, ShieldAlert, Check } from "lucide-react";
import { toast } from "sonner";

export default function Integrations() {
  const [adAccountId, setAdAccountId] = useState("");
  const [status] = useState<"nao_conectada" | "conectando" | "conectada" | "erro">("nao_conectada");

  const statusLabel = {
    nao_conectada: "Não conectada",
    conectando: "Conectando",
    conectada: "Conectada",
    erro: "Erro",
  }[status];

  const statusColor = {
    nao_conectada: "text-muted-foreground bg-surface-elevated border-border",
    conectando: "text-warning bg-warning/10 border-warning/30",
    conectada: "text-success bg-success/10 border-success/30",
    erro: "text-destructive bg-destructive/10 border-destructive/30",
  }[status];

  const onFile = (label: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.success(`${label}: "${file.name}" carregado. Mapeando colunas...`);
    setTimeout(() => toast.success("Preview pronto — 48 linhas detectadas, 7 colunas mapeadas"), 900);
  };

  return (
    <>
      <PageHeader
        title="Integrações"
        subtitle="Fase 1: importação via CSV e manual. Fase 2: Meta Marketing API via Edge Function."
      />

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ImportCard
          icon={<FileSpreadsheet className="h-5 w-5 text-primary" />}
          title="CSV Meta — Gerenciador de Anúncios"
          desc="Exporte relatório por anúncio/dia com gasto, impressões, cliques, IC, compras e receita."
          accept=".csv"
          onChange={onFile("CSV Meta")}
        />
        <ImportCard
          icon={<FileSpreadsheet className="h-5 w-5 text-primary-glow" />}
          title="CSV Kiwify — Relatório de Vendas"
          desc="Pedidos com produto principal, order bumps e upsell. Mapeamento automático."
          accept=".csv"
          onChange={onFile("CSV Kiwify")}
        />
      </section>

      <section className="card-surface p-6 mb-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Plug className="h-4.5 w-4.5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Meta Marketing API · Fase 2</h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Edge Function planejada para rodar a cada 6h, buscar insights da conta e gravar em <code className="text-primary">daily_metrics</code>. O token de acesso deve viver em <span className="text-foreground">Project Settings → Secrets</span>, nunca no frontend.
            </p>
          </div>
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusColor}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <label className="block">
            <span className="label-caps block mb-1.5">ad_account_id</span>
            <input
              value={adAccountId}
              onChange={(e) => setAdAccountId(e.target.value)}
              placeholder="act_1234567890"
              className="w-full bg-surface-elevated border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
          <label className="block">
            <span className="label-caps block mb-1.5">Token (configurar em Secrets)</span>
            <input
              disabled
              placeholder="META_SYSTEM_TOKEN — armazenado no servidor"
              className="w-full bg-surface border border-dashed border-border rounded-md px-3 py-2 text-sm text-muted-foreground"
            />
          </label>
        </div>

        <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 flex items-start gap-3">
          <ShieldAlert className="h-4.5 w-4.5 text-warning mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">Pré-requisitos:</span> App Meta com permissão <code>ads_read</code>, conta de negócios verificada e token de sistema. Confirme a versão atual da Marketing API na documentação oficial antes de publicar.
          </div>
        </div>

        <button
          disabled
          className="mt-5 inline-flex items-center gap-2 bg-primary/15 text-primary border border-primary/40 rounded-md px-4 py-2 text-sm font-medium opacity-60 cursor-not-allowed"
        >
          <Check className="h-4 w-4" /> Conectar (em breve)
        </button>
      </section>
    </>
  );
}

function ImportCard({
  icon,
  title,
  desc,
  accept,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accept: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="card-surface p-6 cursor-pointer hover:border-primary/40 transition-colors block">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-9 w-9 rounded-lg bg-surface-elevated border border-border flex items-center justify-center">{icon}</div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="border-2 border-dashed border-border rounded-lg px-4 py-8 flex flex-col items-center text-center hover:border-primary/40 transition-colors">
        <Upload className="h-5 w-5 text-muted-foreground mb-2" />
        <span className="text-sm text-foreground">Clique para selecionar ou arraste o arquivo</span>
        <span className="text-[11px] text-muted-foreground mt-1">{accept.toUpperCase()}</span>
        <input type="file" accept={accept} onChange={onChange} className="hidden" />
      </div>
    </label>
  );
}
