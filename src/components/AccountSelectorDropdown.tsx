import { useEffect, useState } from "react";
import { Building2, ChevronDown, ChevronRight, Check, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMetaConnection, type AdAccount, type BusinessManager } from "@/hooks/use-meta-connection";
import { useSelectedAccount } from "@/contexts/SelectedAccountContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NavLink } from "react-router-dom";

export function AccountSelectorDropdown() {
  const { data: metaData, isLoading } = useMetaConnection();
  const { selectedAccount, setSelectedAccount } = useSelectedAccount();
  const [open, setOpen] = useState(false);
  const [collapsedBms, setCollapsedBms] = useState<Set<string>>(new Set());

  const connection = metaData?.connection ?? null;
  const accounts = metaData?.accounts ?? [];
  const bms = metaData?.bms ?? [];

  // Auto-select first account
  useEffect(() => {
    if (!selectedAccount && accounts.length > 0) {
      setSelectedAccount(accounts[0]);
    }
  }, [accounts]);

  function getBmForAccount(acc: AdAccount) {
    return bms.find((b) => b.id === acc.bm_db_id);
  }

  function accountsForBm(bm: BusinessManager): AdAccount[] {
    return accounts.filter((a) => a.bm_db_id === bm.id);
  }

  function toggleBm(bmId: string) {
    setCollapsedBms((prev) => {
      const next = new Set(prev);
      next.has(bmId) ? next.delete(bmId) : next.add(bmId);
      return next;
    });
  }

  function selectAccount(acc: AdAccount) {
    setSelectedAccount(acc);
    setOpen(false);
  }

  if (isLoading) return null;

  if (!connection) {
    return (
      <NavLink
        to="/integracoes"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
      >
        <Wifi className="h-3.5 w-3.5" />
        Conectar Meta
      </NavLink>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated border border-border text-xs text-muted-foreground">
        <Building2 className="h-3.5 w-3.5" />
        Sincronizando contas…
      </div>
    );
  }

  const activeBm = selectedAccount ? getBmForAccount(selectedAccount) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface border border-border text-left transition-all w-full">
          <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-foreground truncate leading-tight">
              {selectedAccount?.account_name ?? "Selecionar conta"}
            </div>
            {activeBm && (
              <div className="text-[10px] text-muted-foreground truncate leading-tight">
                {activeBm.bm_name}
              </div>
            )}
          </div>
          <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="p-0 w-72" sideOffset={6}>
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-border">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Selecionar conta de anúncios
          </p>
        </div>

        {/* Scrollable BM list */}
        <div className="overflow-y-auto max-h-[380px] py-1.5">
          {bms.map((bm) => {
            const bmAccounts = accountsForBm(bm);
            if (!bmAccounts.length) return null;
            const isCollapsed = collapsedBms.has(bm.id);

            return (
              <div key={bm.id} className="mb-0.5">
                {/* BM header */}
                <button
                  onClick={() => toggleBm(bm.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-elevated transition-colors text-left"
                >
                  {isCollapsed
                    ? <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    : <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                  }
                  <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex-1 truncate">
                    {bm.bm_name}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">
                    {bmAccounts.length}
                  </span>
                </button>

                {/* Accounts */}
                {!isCollapsed && (
                  <div className="pb-1">
                    {bmAccounts.map((acc) => {
                      const active = selectedAccount?.id === acc.id;
                      return (
                        <button
                          key={acc.id}
                          onClick={() => selectAccount(acc)}
                          className={cn(
                            "w-full flex items-center gap-2.5 pl-8 pr-3 py-2 text-xs transition-all",
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-surface-elevated",
                          )}
                        >
                          <span className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0",
                            acc.sync_enabled ? "bg-success" : "bg-muted-foreground/40",
                          )} />
                          <span className="flex-1 truncate text-left">{acc.account_name}</span>
                          {active && <Check className="h-3 w-3 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {accounts.length} conta{accounts.length !== 1 ? "s" : ""}
          </span>
          <NavLink
            to="/integracoes"
            onClick={() => setOpen(false)}
            className="text-[10px] text-primary hover:underline"
          >
            Gerenciar →
          </NavLink>
        </div>
      </PopoverContent>
    </Popover>
  );
}
