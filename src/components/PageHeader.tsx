import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function PageHeader({ title, subtitle, right }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 mb-7">
      <div>
        <h1 className="text-2xl lg:text-[26px] font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

export function PeriodSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const options = [
    { v: "hoje", l: "Hoje" },
    { v: "7d", l: "7 dias" },
    { v: "30d", l: "30 dias" },
    { v: "custom", l: "Custom" },
  ];
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-lg border border-border bg-surface">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            value === o.v
              ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.4)]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
