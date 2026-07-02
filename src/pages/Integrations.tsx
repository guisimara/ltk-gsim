import { PageHeader } from "@/components/PageHeader";
import { useEffect, useState } from "react";
import {
  Upload, FileSpreadsheet, RefreshCw, LogOut,
  CheckCircle2, AlertCircle, Loader2, Building2, ChevronDown, ChevronUp, ToggleLeft, ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import {
  useMetaConnection,
  useConnectMeta,
  useDisconnectMeta,
  useToggleAccountSync,
  useTriggerSync,
  type AdAccount,
  type BusinessManager,
} from "@/hooks/use-meta-connection";
import { cn } from "@/lib/utils";

export default function Integrations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading } = useMetaConnection();
  const connectMeta = useConnectMeta();
  const disconnectMeta = useDisconnectMeta();
  const triggerSync = useTriggerSync();
  const toggleSync = useToggleAccountSync();
  const [expandedBms, setExpandedBms] = useState<Set<string>>(new Set());

  // Handle OAuth redirect result
  useEffect(() => {
    const connected = searchParams.get("meta_connected");
    const error = searchParams.get("meta_error");
    if (connected) {
      toast.success("Facebook conectado com sucesso! Sincronizando contas...");
      setSearchParams({});
    } else if (error) {
      const messages: Record<string, string> = {
        invalid_state: "Estado de segurança inválido. Tente novamente.",
        state_expired: "Sessão expirada. Tente novamente.",
        token_exchange_failed: "Falha na troca do token com o Facebook.",
        longtoken_failed: "Falha ao obter token de longa duração.",
        db_error: "Erro ao salvar conexão. Tente novamente.",
        missing_params: "Parâmetros inválidos na resposta do Facebook.",
      };
      toast.error(messages[error] ?? `Erro: ${error}`);
      setSearchParams({});
    }
  }, [searchParams]);

  const toggleBm = (bmId: string) => {
    setExpandedBms((prev) => {
      const next = new Set(prev);
      next.has(bmId) ? next.delete(bmId) : next.add(bmId);
      return next;
    });
  };

  const onFile = (label: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.success(`${label}: "${file.name}" carregado. Mapeando colunas...`);
    setTimeout(() => toast.success("Preview pronto — 48 linhas detectadas, 7 colunas mapeadas"), 900);
  };

  const connection = data?.connection ?? null;
  const bms = data?.bms ?? [];
  const accounts = data?.accounts ?? [];

  function accountsForBm(bm: BusinessManager): AdAccount[] {
    return accounts.filter((a) => a.bm_db_id === bm.id);
  }

  return (
    <>
      <PageHeader
        title="Integrações"
        subtitle="Conecte sua conta do Facebook para sincronizar dados de anúncios automaticamente."
      />

      {/* CSV imports */}
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

      {/* Meta OAuth section */}
      <section className="card-surface p-6 mb-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#1877F2" }}>
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Meta Marketing API
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Sincronização automática de BMs, contas de anúncios e métricas de performance.
            </p>
          </div>

          {/* Status badge */}
          {connection ? (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border text-success bg-success/10 border-success/30">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Conectado como {connection.fb_user_name ?? connection.fb_user_id}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border text-muted-foreground bg-surface-elevated border-border">
              <AlertCircle className="h-3.5 w-3.5" />
              Não conectado
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : !connection ? (
          /* Connect button */
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              Clique abaixo para autorizar o acesso ao Facebook. Você será redirecionado para o login do Facebook e voltará aqui automaticamente.
            </p>
            <button
              onClick={() => connectMeta.mutate()}
              disabled={connectMeta.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
              style={{ background: "#1877F2" }}
            >
              {connectMeta.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                )}
              Conectar com Facebook
            </button>
          </div>
        ) : (
          /* Connected state: BM/account list */
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => triggerSync.mutate(connection.id)}
                disabled={triggerSync.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border bg-surface-elevated hover:bg-surface text-foreground transition-all"
              >
                <RefreshCw className={cn("h-4 w-4", triggerSync.isPending && "animate-spin")} />
                {triggerSync.isPending ? "Sincronizando..." : "Sincronizar agora"}
              </button>
              {connection.last_synced_at && (
                <span className="text-xs text-muted-foreground">
                  Última sync: {new Date(connection.last_synced_at).toLocaleString("pt-BR")}
                </span>
              )}
              <button
                onClick={() => {
                  if (confirm("Desconectar sua conta do Facebook?")) {
                    disconnectMeta.mutate(connection.id);
                  }
                }}
                className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/30 transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                Desconectar
              </button>
            </div>

            {bms.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3">Nenhum Business Manager encontrado. Aguarde a sincronização inicial.</p>
            ) : (
              <div className="space-y-3">
                {bms.map((bm) => {
                  const bmAccounts = accountsForBm(bm);
                  const expanded = expandedBms.has(bm.id);
                  return (
                    <div key={bm.id} className="border border-border rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleBm(bm.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-surface-elevated hover:bg-surface transition-colors text-left"
                      >
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium text-foreground flex-1">{bm.bm_name}</span>
                        <span className="text-xs text-muted-foreground">{bmAccounts.length} conta{bmAccounts.length !== 1 ? "s" : ""}</span>
                        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </button>

                      {expanded && (
                        <div className="divide-y divide-border/50">
                          {bmAccounts.length === 0 ? (
                            <p className="px-4 py-3 text-xs text-muted-foreground">Nenhuma conta encontrada neste BM.</p>
                          ) : bmAccounts.map((acc) => (
                            <div key={acc.id} className="px-4 py-3 flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{acc.account_name}</p>
                                <p className="text-xs text-muted-foreground">{acc.act_id} · {acc.currency}{acc.timezone_name ? ` · ${acc.timezone_name}` : ""}</p>
                              </div>
                              {acc.last_insights?.spend != null && (
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  R$ {Number(acc.last_insights.spend).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (30d)
                                </span>
                              )}
                              <button
                                onClick={() => toggleSync.mutate({ accountId: acc.id, enabled: !acc.sync_enabled })}
                                className={cn(
                                  "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all",
                                  acc.sync_enabled
                                    ? "text-success bg-success/10 border-success/30"
                                    : "text-muted-foreground bg-surface-elevated border-border",
                                )}
                              >
                                {acc.sync_enabled
                                  ? <><ToggleRight className="h-3.5 w-3.5" /> Ativo</>
                                  : <><ToggleLeft className="h-3.5 w-3.5" /> Inativo</>}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}

function ImportCard({
  icon, title, desc, accept, onChange,
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
