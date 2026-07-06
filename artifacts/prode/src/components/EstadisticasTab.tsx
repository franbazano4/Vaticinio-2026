import { useMemo } from "react";
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
} from "recharts";
import { PARTICIPANTS, COLORS, FORECASTS, GROUP_MATCHES } from "../data/constants";
import { KNOCKOUT_MATCHES, KNOCKOUT_MATCH_BY_ID, resolveKnockoutBracket, KnockoutResult } from "../data/knockoutBracket";
import { calcPts, calcBonusPoints } from "../lib/logic";
import { calcPlayerKnockoutTotal, calcRondaRelampagoPoints } from "../lib/knockoutLogic";

interface Props {
  results: Record<string, [number, number]>;
  knockoutResults: Record<string, KnockoutResult>;
}

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

export function EstadisticasTab({ results, knockoutResults }: Props) {
  const resolved = useMemo(() => resolveKnockoutBracket(knockoutResults), [knockoutResults]);
  const isGroupStageComplete = useMemo(() => Object.keys(results).length >= 72, [results]);

  // ---------- 1. Resumen general ----------
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

  // ---------- 2. Precisión — Fase de grupos ----------
  const groupAccuracy = useMemo(() => {
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

  // ---------- 3. Precisión — Fase eliminatoria ----------
  const knockoutAccuracy = useMemo(() => {
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

  // ---------- 4. Cadena MAV ----------
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

  // ---------- 5. Evolución de puntos ----------
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

  return (
    <div className="space-y-8">
      {/* Resumen general */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold uppercase text-white border-l-4 border-primary pl-3">Resumen General</h2>
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

      {/* Evolución de puntos */}
      {evolution.length > 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold uppercase text-white border-l-4 border-primary pl-3">Evolución de Puntos</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden p-4">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={evolution} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="fecha" tick={AXIS_TICK} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#fff", fontWeight: 700 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {PARTICIPANTS.map((p, i) => (
                  <Line key={p} type="monotone" dataKey={p} stroke={COLORS[i]} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Precisión de pronósticos */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold uppercase text-white border-l-4 border-primary pl-3">Precisión de Pronósticos</h2>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="bg-black/30 px-4 py-2 border-b border-border">
            <p className="text-primary font-bold uppercase tracking-wider text-sm">Fase de Grupos</p>
          </div>
          <div className="divide-y divide-border/50">
            {groupAccuracy.map((g) => (
              <div key={g.name} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold uppercase text-sm text-white flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
                    {g.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{g.played} partidos vaticinados</span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden bg-black/30 flex">
                  {g.played > 0 && (
                    <>
                      <div className="h-full bg-green-400" style={{ width: `${(g.exact / g.played) * 100}%` }} />
                      <div className="h-full bg-yellow-400" style={{ width: `${(g.sign / g.played) * 100}%` }} />
                      <div className="h-full bg-red-400/70" style={{ width: `${(g.miss / g.played) * 100}%` }} />
                    </>
                  )}
                </div>
                <div className="flex gap-4 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                  <span><span className="text-green-400 font-bold">{g.exact}</span> exactos</span>
                  <span><span className="text-yellow-400 font-bold">{g.sign}</span> solo signo</span>
                  <span><span className="text-red-400 font-bold">{g.miss}</span> fallados</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="bg-black/30 px-4 py-2 border-b border-border">
            <p className="text-primary font-bold uppercase tracking-wider text-sm">Fase Eliminatoria</p>
          </div>
          <div className="divide-y divide-border/50">
            {knockoutAccuracy.map((k) => (
              <div key={k.name} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold uppercase text-sm text-white flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: k.color }} />
                    {k.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{k.played} partidos jugados</span>
                </div>
                {k.played > 0 ? (
                  <>
                    <div className="w-full h-3 rounded-full overflow-hidden bg-black/30 flex">
                      <div className="h-full bg-green-400" style={{ width: `${(k.exact / k.played) * 100}%` }} />
                      <div className="h-full bg-yellow-400" style={{ width: `${(k.sign / k.played) * 100}%` }} />
                      <div className="h-full bg-red-400/70" style={{ width: `${(k.miss / k.played) * 100}%` }} />
                    </div>
                    <div className="flex gap-4 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                      <span><span className="text-green-400 font-bold">{k.exact}</span> exactos</span>
                      <span><span className="text-yellow-400 font-bold">{k.sign}</span> solo signo</span>
                      <span><span className="text-red-400 font-bold">{k.miss}</span> fallados</span>
                      <span><span className="text-primary font-bold">{k.advanceHits}/{k.advanceTotal}</span> quién pasa (Art. 20)</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Sin partidos jugados aún</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cadena MAV */}
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
    </div>
  );
}
