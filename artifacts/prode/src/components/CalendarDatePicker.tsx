import { useState } from "react";

interface CalendarDatePickerProps {
  dates: string[];
  selected: string;
  onSelect: (date: string) => void;
}

const DAY_HEADERS = ["L","M","X","J","V","S","D"];
const MONTH_NAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MONTH_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export function CalendarDatePicker({ dates, selected, onSelect }: CalendarDatePickerProps) {
  const [open, setOpen] = useState(false);
  const matchSet = new Set(dates);

  const parseToDate = (s: string) => {
    const [dd, mm] = s.split("/");
    return new Date(2026, parseInt(mm) - 1, parseInt(dd));
  };

  const selectedDate = parseToDate(selected);
  const selectedLabel = `${String(selectedDate.getDate()).padStart(2,"0")} ${MONTH_FULL[selectedDate.getMonth()]}`;

  const today = new Date();
  const todayStr = `${String(today.getDate()).padStart(2,"0")}/${String(today.getMonth()+1).padStart(2,"0")}`;

  const firstMatch = parseToDate(dates[0]);
  const lastMatch = parseToDate(dates[dates.length - 1]);

  const startOffset = (firstMatch.getDay() + 6) % 7;
  const gridStart = new Date(firstMatch);
  gridStart.setDate(gridStart.getDate() - startOffset);

  const endOffset = (lastMatch.getDay() + 6) % 7;
  const gridEnd = new Date(lastMatch);
  gridEnd.setDate(gridEnd.getDate() + (6 - endOffset));

  const cells: Date[] = [];
  const cur = new Date(gridStart);
  while (cur <= gridEnd) {
    cells.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  const handleSelect = (dateStr: string) => {
    onSelect(dateStr);
    setOpen(false);
  };

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all w-full sm:w-auto
          ${open
            ? "bg-primary/10 border-primary text-primary"
            : "bg-card border-border text-white hover:bg-white/5"
          }`}
      >
        <span className="text-lg">📅</span>
        <span className="font-bold text-sm">{selectedLabel}</span>
        <span className={`ml-auto text-xs transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      {/* Dropdown calendar */}
      {open && (
        <div className="absolute top-full left-0 mt-2 z-20 bg-card border border-border rounded-lg p-3 shadow-2xl min-w-[280px]">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_HEADERS.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              const dd = String(date.getDate()).padStart(2,"0");
              const mm = String(date.getMonth()+1).padStart(2,"0");
              const dateStr = `${dd}/${mm}`;
              const isMatch = matchSet.has(dateStr);
              const isSelected = selected === dateStr;
              const isToday = todayStr === dateStr;
              const monthAbbr = MONTH_NAMES[date.getMonth()];

              if (!isMatch) return <div key={i} />;

              return (
                <button
                  key={dateStr}
                  onClick={() => handleSelect(dateStr)}
                  className={`relative flex flex-col items-center py-1.5 rounded transition-all
                    ${isSelected
                      ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                      : "bg-black/30 hover:bg-white/10 text-white border border-border/50"}
                    ${isToday && !isSelected ? "ring-1 ring-primary/70" : ""}
                  `}
                >
                  <span className="text-[9px] font-bold tracking-wide uppercase leading-none">{monthAbbr}</span>
                  <span className="text-base font-black leading-tight">{date.getDate()}</span>
                  {isToday && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
