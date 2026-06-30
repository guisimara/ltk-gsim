import { cn } from "@/lib/utils";
import type { StatusLevel } from "@/lib/metrics";
import { STATUS_LABEL } from "@/lib/metrics";

const styles: Record<StatusLevel, string> = {
  bom: "bg-success/15 text-success border-success/30",
  atencao: "bg-warning/15 text-warning border-warning/30",
  ruim: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusPill({ status, className }: { status: StatusLevel; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider",
        styles[status],
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "bom" && "bg-success",
          status === "atencao" && "bg-warning",
          status === "ruim" && "bg-destructive",
        )}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}
