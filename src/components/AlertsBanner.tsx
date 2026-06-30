import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface AlertItem {
  level: "ruim" | "atencao";
  title: string;
  message: string;
}

export function AlertsBanner({ alerts }: { alerts: AlertItem[] }) {
  const [dismissed, setDismissed] = useState<number[]>([]);
  const visible = alerts.filter((_, i) => !dismissed.includes(i));
  if (!visible.length) return null;
  return (
    <div className="space-y-2 mb-6">
      {visible.map((a, i) => (
        <div
          key={i}
          className={cn(
            "card-surface flex items-start gap-3 px-4 py-3 border-l-4",
            a.level === "ruim" ? "border-l-destructive" : "border-l-warning",
          )}
        >
          <AlertTriangle
            className={cn(
              "h-4.5 w-4.5 mt-0.5 shrink-0",
              a.level === "ruim" ? "text-destructive" : "text-warning",
            )}
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">{a.title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{a.message}</div>
          </div>
          <button
            onClick={() => setDismissed((d) => [...d, alerts.indexOf(a)])}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dispensar alerta"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
