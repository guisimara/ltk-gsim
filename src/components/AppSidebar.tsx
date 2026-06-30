import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Filter,
  Image as ImageIcon,
  Megaphone,
  Wallet,
  PlugZap,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/funil", label: "Funil", icon: Filter },
  { to: "/criativos", label: "Criativos", icon: ImageIcon },
  { to: "/campanhas", label: "Campanhas", icon: Megaphone },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/integracoes", label: "Integrações", icon: PlugZap },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export function AppSidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-border bg-sidebar h-screen sticky top-0 flex flex-col">
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-border">
        <div className="h-9 w-9 rounded-xl bg-gradient-neon flex items-center justify-center shadow-glow-soft">
          <Zap className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight text-foreground">LowTicket OS</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Motor de decisão</div>
        </div>
      </div>

      <nav className="px-3 py-4 flex flex-col gap-1 flex-1">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.35)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn("h-4 w-4", isActive && "drop-shadow-[0_0_6px_hsl(var(--primary))]")} />
                {label}
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="card-elevated p-3 text-xs text-muted-foreground">
          <div className="text-foreground font-medium mb-1">Conta: Mulher de Provérbios</div>
          Operação em modo demo · dados de exemplo
        </div>
      </div>
    </aside>
  );
}
