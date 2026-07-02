import { ReactNode, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function PageHeader({ title, subtitle, right }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 mb-5 sm:mb-7">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl lg:text-[26px] font-semibold tracking-tight text-foreground leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-snug">{subtitle}</p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}

interface PeriodSelectorProps {
  value: string;
  onChange: (v: string, range?: DateRange) => void;
  options?: Array<{ v: string; l: string }>;
}

export function PeriodSelector({ value, onChange, options }: PeriodSelectorProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>();

  const defaultOptions = options ?? [
    { v: "3d", l: "3 dias" },
    { v: "7d", l: "7 dias" },
    { v: "30d", l: "30 dias" },
    { v: "custom", l: "Custom" },
  ];

  const handleSelect = (v: string) => {
    if (v === "custom") {
      setCalendarOpen(true);
    }
    onChange(v);
  };

  const handleRangeSelect = (r: DateRange | undefined) => {
    setRange(r);
    if (r?.from && r?.to) {
      onChange("custom", r);
      setCalendarOpen(false);
    }
  };

  const customLabel =
    value === "custom" && range?.from && range?.to
      ? `${format(range.from, "dd/MM")} – ${format(range.to, "dd/MM")}`
      : "Custom";

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-surface flex-wrap">
      {defaultOptions.map((o) =>
        o.v === "custom" ? (
          <Popover key="custom" open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={() => handleSelect("custom")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                  value === "custom"
                    ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.4)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CalendarIcon className="h-3 w-3" />
                {customLabel}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={range}
                onSelect={handleRangeSelect}
                locale={ptBR}
                numberOfMonths={2}
                initialFocus
              />
              {range?.from && !range?.to && (
                <p className="text-xs text-muted-foreground text-center pb-3">
                  Selecione a data final
                </p>
              )}
            </PopoverContent>
          </Popover>
        ) : (
          <button
            key={o.v}
            onClick={() => handleSelect(o.v)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              value === o.v
                ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.4)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.l}
          </button>
        )
      )}
    </div>
  );
}
