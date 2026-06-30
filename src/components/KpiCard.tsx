import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusPill } from "./StatusPill";
import type { StatusLevel } from "@/lib/metrics";

interface KpiCardProps {
  label: string;
  value: string;
  status?: StatusLevel;
  baseLabel?: string;
  trend?: number; // % vs período anterior
  trendInvert?: boolean; // se true: queda é boa (CPA, CPC)
  microcopy?: string;
  highlight?: boolean;
}

export function KpiCard({
  label,
  value,
  status,
  baseLabel,
  trend,
  trendInvert,
  microcopy,
  highlight,
}: KpiCardProps) {
  const trendUp = trend !== undefined && trend > 0.1;
  const trendDown = trend !== undefined && trend < -0.1;
  const isGood = trendInvert ? trendDown : trendUp;
  const isBad = trendInvert ? trendUp : trendDown;

  return (
    <div
      className={cn(
        "card-surface p-5 flex flex-col gap-3 transition-all",
        highlight && "card-active-glow",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="label-caps">{label}</span>
        {status && <StatusPill status={status} />}
      </div>

      <div className="flex items-baseline gap-3">
        <span
          className={cn(
            "num-tabular text-[34px] leading-none font-semibold",
            highlight && "neon-text",
          )}
        >
          {value}
        </span>
        {trend !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium num-tabular",
              isGood && "text-success",
              isBad && "text-destructive",
              !isGood && !isBad && "text-muted-foreground",
            )}
          >
            {trendUp ? <ArrowUp className="h-3.5 w-3.5" /> : trendDown ? <ArrowDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {baseLabel && <span>base: {baseLabel}</span>}
        {microcopy && <span className="truncate ml-2 text-right">{microcopy}</span>}
      </div>
    </div>
  );
}
