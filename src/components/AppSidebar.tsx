import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Filter, Image as ImageIcon, Megaphone,
  Wallet, PlugZap, Settings, Zap, LogOut, GitBranch,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { AccountSelectorDropdown } from "@/components/AccountSelectorDropdown";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { to: "/",                    label: "Dashboard",           icon: LayoutDashboard, end: true },
  { to: "/funil",               label: "Análise Detalhada",   icon: Filter },
  { to: "/criativos",           label: "Criativos",           icon: ImageIcon },
  { to: "/campanhas",           label: "Campanhas",           icon: Megaphone },
  { to: "/financeiro",          label: "Financeiro",          icon: Wallet },
  { to: "/funil-personalizado", label: "Funil Personalizado", icon: GitBranch },
  { to: "/integracoes",         label: "Integrações",         icon: PlugZap },
  { to: "/configuracoes",       label: "Configurações",       icon: Settings },
];

interface AppSidebarProps {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AppSidebar({ onNavigate, collapsed = false, onToggleCollapse }: AppSidebarProps) {
  const { user, signOut } = useAuth();

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-border bg-sidebar h-screen sticky top-0 flex flex-col transition-all duration-200",
        collapsed ? "w-14" : "w-56",
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b border-border shrink-0",
        collapsed ? "justify-center px-0 py-4" : "px-5 py-5 gap-2.5",
      )}>
        <div className="h-8 w-8 rounded-xl bg-gradient-neon flex items-center justify-center shadow-glow-soft shrink-0">
          <Zap className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="leading-tight overflow-hidden">
            <div className="text-sm font-semibold tracking-tight text-foreground whitespace-nowrap">LT Metrics</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">Motor de decisão</div>
          </div>
        )}
      </div>

      {/* Account selector */}
      {!collapsed && (
        <div className="px-2 pt-2 pb-1 border-b border-border shrink-0">
          <AccountSelectorDropdown />
        </div>
      )}

      {/* Nav */}
      <nav className="px-2 py-3 flex flex-col gap-0.5 flex-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          collapsed ? (
            <Tooltip key={to} delayDuration={0}>
              <TooltipTrigger asChild>
                <NavLink
                  to={to}
                  end={end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center justify-center rounded-lg p-2.5 transition-all",
                      isActive
                        ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.35)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated",
                    )
                  }
                >
                  {({ isActive }) => (
                    <Icon className={cn("h-4.5 w-4.5", isActive && "drop-shadow-[0_0_6px_hsl(var(--primary))]")} />
                  )}
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ) : (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.35)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("h-4 w-4 shrink-0", isActive && "drop-shadow-[0_0_6px_hsl(var(--primary))]")} />
                  <span className="truncate">{label}</span>
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow shrink-0" />}
                </>
              )}
            </NavLink>
          )
        ))}
      </nav>

      {/* Footer */}
      <div className={cn("border-t border-border flex flex-col gap-1.5 shrink-0", collapsed ? "p-2" : "p-3")}>
        {!collapsed && (
          <div className="card-elevated px-3 py-2 text-xs text-muted-foreground rounded-lg">
            <div className="text-foreground font-medium truncate">{user?.email ?? "Conta"}</div>
            <div className="text-[10px] mt-0.5">operação ativa</div>
          </div>
        )}

        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={signOut}
                className="flex items-center justify-center p-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Sair</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all w-full"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        )}

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-elevated rounded-lg transition-all w-full",
              collapsed && "justify-center px-2.5",
            )}
          >
            {collapsed
              ? <ChevronRight className="h-4 w-4" />
              : <><ChevronLeft className="h-4 w-4" /><span>Recolher</span></>}
          </button>
        )}
      </div>
    </aside>
  );
}
