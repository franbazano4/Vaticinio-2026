import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  Brush,
} from "recharts";
import { PARTICIPANTS, COLORS, FORECASTS, GROUP_MATCHES } from "../data/constants";
import { KNOCKOUT_MATCHES, KNOCKOUT_MATCH_BY_ID, resolveKnockoutBracket, KnockoutResult } from "../data/knockoutBracket";
import { calcPts, calcBonusPoints } from "../lib/logic";
import { calcPlayerKnockoutTotal, calcRondaRelampagoPoints } from "../lib/knockoutLogic";

interface Props {
  results: Record<string, [number, number]>;
  knockoutResults: Record<string, KnockoutResult>;
}

type StatsSubTab = "TOTALES" | "PRECISION" | "MAV";
const SUBTAB_LABELS: Record<StatsSubTab, string> = {
  TOTALES: "Totales",
  PRECISION: "Precisión",
  MAV: "MAV",
};

type PrecisionSubTab = "TOTAL" | "GRUPOS" | "FINAL";
const PRECISION_SUBTAB_LABELS: Record<PrecisionSubTab, string> = {
  TOTAL: "Total",
  GRUPOS: "Fase de Grupos",
  FINAL: "Fase Final",
};

const dateSortKey = (d: string) => {
  const [dd, mm] = d.split("/");
  return `${mm}${dd}`;
};

const TOOLTIP_STYLE = {
  backgroundColor: "#1a1a1a",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6,
  fontSize: 12,
};
const AXIS_TICK = { fill: "#8b8b93", fontSize: 11 };
const GRID_STROKE = "rgba(255,255,255,0.08)";

interface AccuracyEntry {
  name: string;
  color: string;
  exact: number;
  sign: number;
  miss: number;
  played: number;
  advanceHits?: number;
  advanceTotal?: number;
}

function AccuracyRow({ entry, showAdvance }: { entry: AccuracyEntry; showAdvance?: boolean }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-bold uppercase text-sm text-white flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
          {entry.name}
        </span>
        <span className="text-xs text-muted-foreground">{entry.played} pronósticos</span>
      </div>
      {entry.played > 0 ? (
        <>
          <div className="w-full h-3 rounded-full overflow-hidden bg-black/30 flex">
            <div className="h-full bg-green-400" style={{ width: `${(entry.exact / entry.played) * 100}%` }} />
            <div className="h-full bg-yellow-400" style={{ width: `${(entry.sign / entry.played) * 100}%` }} />
            <div className="h-full bg-red-400/70" style={{ width: `${(entry.miss / entry.played) * 100}%` }} />
          </div>
          <div className="flex gap-4 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
            <span><span className="text-green-400 font-bold">{entry.exact}</span> exactos</span>
            <span><span className="text-yellow-400 font-bold">{entry.sign}</span> solo signo</span>
            <span><span className="text-red-400 font-bold">{entry.miss}</span> fallados</span>
            {showAdvance && entry.advanceTotal ? (
              <span><span className="text-primary font-bold">{entry.advanceHits}/{entry.advanceTotal}</span> quién pasa (Art. 20)</span>
            ) : null}
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground italic">Sin pronósticos jugados aún</p>
      )}
    </div>
  );
}

interface EvolutionTooltipPayloadEntry {
  dataKey?: string | number;
  value?: number;
  color?: string;
}

function EvolutionTooltip(props: {
  active?: boolean;
  payload?: EvolutionTooltipPayloadEntry[];
  label?: string;
}) {
  const { active, payload, label } = props;
  if (!active || !payload || payload.length === 0) return null;
  const sorted = [...payload].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  return (
    <div style={TOOLTIP_STYLE} className="px-2.5 py-1.5">
      <div className="font-bold text-white mb-1">{label}</div>
      <div className="space-y-1">
        {sorted.map((entry) => (
          <div key={String(entry.dataKey)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: entry.color }} />
              {entry.dataKey}
            </span>
            <span className="font-mono font-bold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EstadisticasTab({ results, knockoutResults }: Props) {
  const [subTab, setSubTab] = useState<StatsSubTab>("TOTALES");
  const [precisionSubTab, setPrecisionSubTab] = useState<PrecisionSubTab>("TOTAL");
  const [zoomRange, setZoomRange] = useState<[number, number] | null>(null);

  const resolved = useMemo(() => resolveKnockoutBracket(knockoutResults), [knockoutResults]);
  const isGroupStageComplete = useMemo(() => Object.keys(results).length >= 72, [results]);

  // ---------- Resumen general (totales por jugador) ----------
  const summary = useMemo(() => {
    return PARTICIPANTS.map((p, i) => {
      let matchPts = 0;
      for (const m of GROUP_MATCHES) {
        const pred = FORECASTS[`${p}_${m.id}`];
        const real = results[m.id];
        if (pred && real) matchPts += calcPts(pred, real);
      }
      const bonus = calcBonusPoints(p, FORECASTS, results);
      const knockout = calcPlayerKnockoutTotal(p, resolved, knockoutResults);
      const relampago = calcRondaRelampagoPoints(p, resolved);
      const bonusTotal = isGroupStageComplete ? bonus.total : 0;
      const total = matchPts + bonusTotal + knockout.total + relampago.total;
      return {
        name: p,
        color: COLORS[i],
        Grupos: matchPts,
        Bonus: bonusTotal,
        "Fase Final": knockout.total,
        "Ronda Relámpago": relampago.total,
        total,
        knockoutByMatch: knockout.byMatch,
      };
    }).sort((a, b) => b.total - a.total);
  }, [results, knockoutResults, resolved, isGroupStageComplete]);

  // ---------- Precisión — Fase de grupos ----------
  const groupAccuracy: AccuracyEntry[] = useMemo(() => {
    return PARTICIPANTS.map((p, i) => {
      let exact = 0, sign = 0, miss = 0, played = 0;
      for (const m of GROUP_MATCHES) {
        const real = results[m.id];
        const pred = FORECASTS[`${p}_${m.id}`];
        if (!real || !pred) continue;
        played++;
        const pts = calcPts(pred, real);
        if (pts === 4) exact++;
        else if (pts === 2) sign++;
        else miss++;
      }
      return { name: p, color: COLORS[i], exact, sign, miss, played };
    });
  }, [results]);

  // ---------- Precisión — Fase eliminatoria ----------
  const knockoutAccuracy: AccuracyEntry[] = useMemo(() => {
    return summary.map(({ name, color, knockoutByMatch }) => {
      let exact = 0, sign = 0, miss = 0, played = 0, advanceHits = 0, advanceTotal = 0;
      Object.values(knockoutByMatch).forEach((b) => {
        if (!b.played) return;
        played++;
        if (b.signPts === 4) exact++;
        else if (b.signPts === 2) sign++;
        else miss++;
        advanceTotal++;
        if (b.advancePts > 0) advanceHits++;
      });
      return { name, color, exact, sign, miss, played, advanceHits, advanceTotal };
    });
  }, [summary]);

  // ---------- Precisión — Total (grupos + eliminatoria combinados) ----------
  const totalAccuracy: AccuracyEntry[] = useMemo(() => {
    return PARTICIPANTS.map((p, i) => {
      const g = groupAccuracy.find((x) => x.name === p)!;
      const k = knockoutAccuracy.find((x) => x.name === p)!;
      return {
        name: p,
        color: COLORS[i],
        exact: g.exact + k.exact,
        sign: g.sign + k.sign,
        miss: g.miss + k.miss,
        played: g.played + k.played,
        advanceHits: k.advanceHits,
        advanceTotal: k.advanceTotal,
      };
    });
  }, [groupAccuracy, knockoutAccuracy]);

  // ---------- Ranking de % de aciertos (arriba de todo en Precisión) ----------
  const hitRateRanking = useMemo(() => {
    return totalAccuracy
      .map((e) => ({
        ...e,
        rate: e.played > 0 ? ((e.exact + e.sign) / e.played) * 100 : 0,
        exactRate: e.played > 0 ? (e.exact / e.played) * 100 : 0,
      }))
      .sort((a, b) => b.rate - a.rate);
  }, [totalAccuracy]);

  // ---------- Cadena MAV ----------
  const mavStats = useMemo(() => {
    return summary.map(({ name, color, knockoutByMatch }) => {
      const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
      let chainEligible = 0, overrides = 0;
      Object.entries(knockoutByMatch).forEach(([id, b]) => {
        const round = KNOCKOUT_MATCH_BY_ID[id]?.round;
        if (!b.participantsKnown) return;
        if (round === "R32" || round === "F" || round === "TP") return;
        chainEligible++;
        const m = Math.round(b.multiplier);
        dist[m] = (dist[m] ?? 0) + 1;
        if (b.usingForecast === "override") overrides++;
      });
      const avgMultiplier = chainEligible > 0
        ? Object.entries(dist).reduce((acc, [k, v]) => acc + Number(k) * v, 0) / chainEligible
        : 0;
      return { name, color, dist, chainEligible, overrides, avgMultiplier };
    });
  }, [summary]);

  // ---------- Evolución de puntos ----------
  const evolution = useMemo(() => {
    const allDates = Array.from(
      new Set([...GROUP_MATCHES.map((m) => m.fecha), ...KNOCKOUT_MATCHES.map((m) => m.fecha)])
    ).sort((a, b) => dateSortKey(a).localeCompare(dateSortKey(b)));

    const playedDates = allDates.filter(
      (d) =>
        GROUP_MATCHES.some((m) => m.fecha === d && results[m.id]) ||
        KNOCKOUT_MATCHES.some((m) => m.fecha === d && knockoutResults[m.id])
    );

    return playedDates.map((d) => {
      const cutoff = dateSortKey(d);
      const gSnap: Record<string, [number, number]> = {};
      for (const m of GROUP_MATCHES) {
        if (dateSortKey(m.fecha) <= cutoff && results[m.id]) gSnap[m.id] = results[m.id];
      }
      const kSnap: Record<string, KnockoutResult> = {};
      for (const m of KNOCKOUT_MATCHES) {
        if (dateSortKey(m.fecha) <= cutoff && knockoutResults[m.id]) kSnap[m.id] = knockoutResults[m.id];
      }
      const resolvedSnap = resolveKnockoutBracket(kSnap);
      const groupsComplete = Object.keys(gSnap).length >= 72;

      const row: Record<string, number | string> = { fecha: d };
      PARTICIPANTS.forEach((p) => {
        let matchPts = 0;
        for (const m of GROUP_MATCHES) {
          const pred = FORECASTS[`${p}_${m.id}`];
          const real = gSnap[m.id];
          if (pred && real) matchPts += calcPts(pred, real);
        }
        const bonusTotal = groupsComplete ? calcBonusPoints(p, FORECASTS, gSnap).total : 0;
        const knockoutTotal = calcPlayerKnockoutTotal(p, resolvedSnap, kSnap).total;
        const relampagoTotal = calcRondaRelampagoPoints(p, resolvedSnap).total;
        row[p] = matchPts + bonusTotal + knockoutTotal + relampagoTotal;
      });
      return row;
    });
  }, [results, knockoutResults]);

  const lastIndex = Math.max(evolution.length - 1, 0);
  const zoomStart = zoomRange ? Math.min(zoomRange[0], lastIndex) : 0;
  const zoomEnd = zoomRange ? Math.min(zoomRange[1], lastIndex) : lastIndex;

  return (
    <div className="space-y-6">
      <div className="flex border-b border-border overflow-x-auto">
        {(["TOTALES", "PRECISION", "MAV"] as StatsSubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-4 py-3 text-sm font-bold tracking-wider uppercase transition-colors relative whitespace-nowrap ${
              subTab === t ? "text-primary" : "text-muted-foreground hover:text-white"
            }`}
          >
            {SUBTAB_LABELS[t]}
            {subTab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      {/* ---------------- TOTALES ---------------- */}
      {subTab === "TOTALES" && (
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-lg font-bold uppercase text-white border-l-4 border-primary pl-3">Evolución de Puntos</h2>
            {evolution.length > 0 ? (
              <div className="space-y-3">
                <div className="bg-card border border-border rounded-lg overflow-hidden p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={evolution} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                      <XAxis dataKey="fecha" tick={AXIS_TICK} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
                      <YAxis tick={AXIS_TICK} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
                      <Tooltip content={(p: any) => <EvolutionTooltip {...p} />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {PARTICIPANTS.map((p, i) => (
                        <Line key={p} type="monotone" dataKey={p} stroke={COLORS[i]} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                      ))}
                      {evolution.length > 1 && (
                        <Brush
                          dataKey="fecha"
                          height={26}
                          stroke="#FFD700"
                          fill="rgba(255,255,255,0.03)"
                          travellerWidth={8}
                          startIndex={zoomStart}
                          endIndex={zoomEnd}
                          onChange={(r) => {
                            if (r && typeof r.startIndex === "number" && typeof r.endIndex === "number") {
                              setZoomRange([r.startIndex, r.endIndex]);
                            }
                          }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {evolution.length > 1 && (
                  <p className="text-[11px] text-muted-foreground text-center">
                    Arrastrá los extremos de la franja inferior del gráfico para acercarte a un período.
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-6 text-center text-sm text-muted-foreground italic">
                Sin resultados cargados todavía.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold uppercase text-white border-l-4 border-primary pl-3">De dónde suma cada uno</h2>
            <div className="bg-card border border-border rounded-lg overflow-hidden p-4">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={summary} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="name" tick={AXIS_TICK} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
                  <YAxis tick={AXIS_TICK} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#fff", fontWeight: 700 }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Grupos" stackId="a" fill="#00BFFF" />
                  <Bar dataKey="Bonus" stackId="a" fill="#98FB98" />
                  <Bar dataKey="Fase Final" stackId="a" fill="#FFD700" />
                  <Bar dataKey="Ronda Relámpago" stackId="a" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto bg-card border border-border rounded-md shadow-sm">
              <table className="w-full text-sm text-center whitespace-nowrap">
                <thead className="text-xs text-muted-foreground bg-black/40 border-b border-border font-mono uppercase">
                  <tr>
                    <th className="px-4 py-2 text-left">Jugador</th>
                    <th className="px-3 py-2">Grupos</th>
                    <th className="px-3 py-2">Bonus</th>
                    <th className="px-3 py-2">Fase Final</th>
                    <th className="px-3 py-2">R. Relámpago</th>
                    <th className="px-3 py-2 text-primary">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {summary.map((s, idx) => (
                    <tr key={s.name} className={idx === 0 ? "bg-primary/5" : ""}>
                      <td className="px-4 py-2.5 text-left font-bold uppercase">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                          {s.name}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{s.Grupos}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{s.Bonus}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{s["Fase Final"]}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{s["Ronda Relámpago"]}</td>
                      <td className="px-3 py-2.5 font-black text-white text-base">{s.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- PRECISIÓN ---------------- */}
      {subTab === "PRECISION" && (
        <div className="space-y-6">
          <div className="overflow-x-auto bg-card border border-border rounded-md shadow-sm">
            <table className="w-full text-sm text-center whitespace-nowrap">
              <thead className="text-xs text-muted-foreground bg-black/40 border-b border-border font-mono uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Jugador</th>
                  <th className="px-3 py-2 text-primary">% Acierto</th>
                  <th className="px-3 py-2">% Exacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {hitRateRanking.map((e, idx) => (
                  <tr key={e.name} className={idx === 0 ? "bg-primary/5" : ""}>
                    <td className="px-4 py-2.5 text-left font-bold uppercase">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                        {e.name}
                      </div>
                    </td>
                    <td className={`px-3 py-2.5 font-black text-base ${idx === 0 ? "text-primary" : "text-white"}`}>{e.rate.toFixed(0)}%</td>
                    <td className="px-3 py-2.5 text-green-400 font-bold">{e.exactRate.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <div className="flex border-b border-border overflow-x-auto">
              {(["TOTAL", "GRUPOS", "FINAL"] as PrecisionSubTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setPrecisionSubTab(t)}
                  className={`px-4 py-3 text-sm font-bold tracking-wider uppercase transition-colors relative whitespace-nowrap ${
                    precisionSubTab === t ? "text-primary" : "text-muted-foreground hover:text-white"
                  }`}
                >
                  {PRECISION_SUBTAB_LABELS[t]}
                  {precisionSubTab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
              ))}
            </div>

            {precisionSubTab === "TOTAL" && (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="bg-black/30 px-4 py-2 border-b border-border">
                  <p className="text-primary font-bold uppercase tracking-wider text-sm">Total (Grupos + Eliminatoria)</p>
                </div>
                <div className="divide-y divide-border/50">
                  {totalAccuracy.map((e) => (
                    <AccuracyRow key={e.name} entry={e} showAdvance />
                  ))}
                </div>
              </div>
            )}

            {precisionSubTab === "GRUPOS" && (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="bg-black/30 px-4 py-2 border-b border-border">
                  <p className="text-primary font-bold uppercase tracking-wider text-sm">Fase de Grupos</p>
                </div>
                <div className="divide-y divide-border/50">
                  {groupAccuracy.map((e) => (
                    <AccuracyRow key={e.name} entry={e} />
                  ))}
                </div>
              </div>
            )}

            {precisionSubTab === "FINAL" && (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="bg-black/30 px-4 py-2 border-b border-border">
                  <p className="text-primary font-bold uppercase tracking-wider text-sm">Fase Eliminatoria</p>
                </div>
                <div className="divide-y divide-border/50">
                  {knockoutAccuracy.map((e) => (
                    <AccuracyRow key={e.name} entry={e} showAdvance />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- MAV ---------------- */}
      {subTab === "MAV" && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold uppercase text-white border-l-4 border-primary pl-3">Cadena MAV</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-center whitespace-nowrap">
                <thead className="text-xs text-muted-foreground bg-black/40 border-b border-border font-mono uppercase">
                  <tr>
                    <th className="px-4 py-2 text-left">Jugador</th>
                    <th className="px-3 py-2">x1</th>
                    <th className="px-3 py-2">x2</th>
                    <th className="px-3 py-2">x3</th>
                    <th className="px-3 py-2">x4</th>
                    <th className="px-3 py-2">Prom.</th>
                    <th className="px-3 py-2">Re-vaticinios</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {mavStats.map((m) => (
                    <tr key={m.name}>
                      <td className="px-4 py-2.5 text-left font-bold uppercase">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                          {m.name}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{m.dist[1] ?? 0}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{m.dist[2] ?? 0}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{m.dist[3] ?? 0}</td>
                      <td className="px-3 py-2.5 text-green-400 font-bold">{m.dist[4] ?? 0}</td>
                      <td className="px-3 py-2.5 font-bold text-white">x{m.avgMultiplier.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{m.overrides}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {mavStats.every((m) => m.chainEligible === 0) && (
              <p className="px-4 py-3 text-xs text-muted-foreground italic border-t border-border">
                Aún no hay cruces de Octavos en adelante con equipos definidos.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
