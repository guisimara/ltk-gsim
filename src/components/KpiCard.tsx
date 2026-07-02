import { ArrowDown, ArrowUp, Minus, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusPill } from "./StatusPill";
import type { StatusLevel } from "@/lib/metrics";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KpiCardProps {
  label: string;
  value: string;
  info?: string;
  status?: StatusLevel;
  baseLabel?: string;
  trend?: number;
  trendInvert?: boolean;
  microcopy?: string;
  highlight?: boolean;
}

export function KpiCard({
  label,
  value,
  info,
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
        "card-surface p-4 flex flex-col justify-between h-[130px] transition-all overflow-hidden",
        highlight && "card-active-glow",
      )}
    >
      {/* Row 1: label + status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="label-caps truncate text-[10px] sm:text-[11px]">{label}</span>
          {info && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px] text-xs leading-relaxed">
                {info}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {status && <StatusPill status={status} />}
      </div>

      {/* Row 2: value + trend */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span
          className={cn(
            "num-tabular text-2xl sm:text-[26px] leading-none font-semibold",
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
            {trendUp ? <ArrowUp className="h-3 w-3" /> : trendDown ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Row 3: base label / microcopy */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {baseLabel ? <span className="truncate">base: {baseLabel}</span> : <span />}
        {microcopy && <span className="truncate ml-2 text-right">{microcopy}</span>}
      </div>
    </div>
  );
}
