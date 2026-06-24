import { useMemo, useState } from "react";
import { PARTICIPANTS, COLORS, FORECASTS, GROUPS, FLAG_CODE } from "../data/constants";
import { calcBonusPoints, getPlayerGroupStandings, getGroupStandings, getActualBestThirds } from "../lib/logic";

interface Props {
  results: Record<string, [number, number]>;
}

const groupKeys = Object.keys(GROUPS);

const SHORT: Record<string, string> = {
  "Países Bajos": "P. Bajos",
  "Corea del Sur": "Corea",
  "Rep. Checa": "Chequia",
  "Bosnia y Herz.": "Bosnia",
  "Costa de Marfil": "C. Marfil",
  "Nueva Zelanda": "N. Zelanda",
  "Cabo Verde": "C. Verde",
  "Arabia Saudita": "A. Saudita",
  "R.D. Congo": "Congo",
};

const shorten = (name: string) => SHORT[name] ?? name;
const ART19BIS_SCALE = [1, 2, 2, 3, 3, 4, 4, 5];

export function BonusTab({ results }: Props) {
  const [subTab, setSubTab] = useState<string>("A");

  const rows = useMemo(() => {
    return PARTICIPANTS.map((p, i) => {
      const bonus = calcBonusPoints(p, FORECASTS, results);
      return { name: p, color: COLORS[i], ...bonus };
    }).sort((a, b) => b.total - a.total);
  }, [results]);

  const groupDetail = useMemo(() => {
    if (subTab === "TERCEROS") return null;
    const g = subTab;
    const actual = getGroupStandings(g, results);
    const actualBestThirds = new Set(getActualBestThirds(results));

    // Build set of actual qualifiers for this group from the qualifiersByGroup map
    const actualQ = new Set<string>();
    if (actual[0]) actualQ.add(actual[0].name);
    if (actual[1]) actualQ.add(actual[1].name);
    const thirdClassifies = !!(actual[2] && actualBestThirds.has(actual[2].name));
    if (thirdClassifies && actual[2]) actualQ.add(actual[2].name);

    const playerPreds = PARTICIPANTS.map((p, i) => ({
      name: p,
      color: COLORS[i],
      pred: getPlayerGroupStandings(p, g, FORECASTS),
    }));

    const teamRows = [0, 1, 2, 3].map(pos => {
      const actualTeam = actual[pos];
      const isQualifier = pos < 2 || (pos === 2 && thirdClassifies);
      const isThird = pos === 2 && !thirdClassifies;
      const playerCols = playerPreds.map(({ name, pred }) => {
        const predTeam = pred[pos];
        const posHit = !!(actualTeam && predTeam && actualTeam.name === predTeam.name);
        const qualHit = !!(predTeam && actualQ.has(predTeam.name));
        const thirdHit = !!(isThird && predTeam && actualBestThirds.has(predTeam.name));
        return { name, predTeam: predTeam?.name ?? "—", posHit, qualHit, thirdHit };
      });
      return { pos, actualTeam: actualTeam?.name ?? "—", isQualifier, isThird, playerCols };
    });

    const playerTotals = PARTICIPANTS.map((p, i) => {
      let art18pts = 0;
      const pred = playerPreds[i].pred;
      actual.forEach((t, pos) => {
        if (pred[pos] && pred[pos].name === t.name) art18pts++;
      });
      // Player's predicted qualifiers: top-2 always, plus their 3rd only if
      // it's among their own predicted best 8 thirds
      const playerThirdsForBonus: { name: string; pts: number; dif: number; gf: number }[] = [];
      for (const gr of groupKeys) {
        const grPred = getPlayerGroupStandings(p, gr, FORECASTS);
        if (grPred[2]) playerThirdsForBonus.push(grPred[2]);
      }
      playerThirdsForBonus.sort((a: { pts: number; dif: number; gf: number }, b: { pts: number; dif: number; gf: number }) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.dif !== a.dif) return b.dif - a.dif;
        return b.gf - a.gf;
      });
      const playerBestThirds = new Set(playerThirdsForBonus.slice(0, 8).map((t: { name: string }) => t.name));
      const predictedQ = new Set<string>();
      if (pred[0]) predictedQ.add(pred[0].name);
      if (pred[1]) predictedQ.add(pred[1].name);
      if (pred[2] && playerBestThirds.has(pred[2].name)) predictedQ.add(pred[2].name);
      let qualHits = 0;
      predictedQ.forEach((name: string) => {
        if (actualQ.has(name)) qualHits++;
      });
      const art19pts = qualHits === 0 ? 0 : qualHits === 1 ? 2 : 2 + (qualHits - 1) * 3;
      return { name: p, art18pts, art19pts };
    });

    return { g, actual, teamRows, playerTotals, thirdClassifies };
  }, [results, subTab]);

  const tercerosDetail = useMemo(() => {
    const realThirdsStats: { group: string; team: string; pts: number; dif: number; gf: number }[] = [];
    for (const g of groupKeys) {
      const st = getGroupStandings(g, results);
      if (st[2]) realThirdsStats.push({ group: g, team: st[2].name, pts: st[2].pts, dif: st[2].dif, gf: st[2].gf });
    }
    realThirdsStats.sort((a, b) => b.pts - a.pts || b.dif - a.dif || b.gf - a.gf);
    const qualifiedSet = new Set(realThirdsStats.slice(0, 8).map(t => t.team));
    const thirdPosMap = new Map<string, number>();
    realThirdsStats.slice(0, 8).forEach((t, i) => thirdPosMap.set(t.team, i));

    const playerPredictions = PARTICIPANTS.map((p, i) => {
      const playerThirds: { team: string; pts: number; dif: number; gf: number }[] = [];
      for (const g of groupKeys) {
        const pred = getPlayerGroupStandings(p, g, FORECASTS);
        if (pred[2]) playerThirds.push({ team: pred[2].name, pts: pred[2].pts, dif: pred[2].dif, gf: pred[2].gf });
      }
      playerThirds.sort((a, b) => b.pts - a.pts || b.dif - a.dif || b.gf - a.gf);

      let totalPts = 0;
      playerThirds.forEach((pt, idx) => {
        const realTeamAtPos = realThirdsStats[idx]?.team;
        if (idx < 8 && pt.team === realTeamAtPos) {
          const realPos = thirdPosMap.get(pt.team) ?? 0;
          totalPts += ART19BIS_SCALE[realPos] ?? 5;
        }
      });

      return { name: p, color: COLORS[i], playerThirds, totalPts };
    });

    return { realThirds: realThirdsStats, qualifiedSet, playerPredictions };
  }, [results]);

  return (
    <div className="space-y-8">
      {/* Summary table */}
      <div>
        <h2 className="text-lg font-bold uppercase text-white border-l-4 border-primary pl-3 mb-3">Resumen de Bonificaciones</h2>
        <div className="overflow-x-auto bg-card border border-border rounded-md shadow-sm">
          <table className="w-full text-sm text-center whitespace-nowrap">
            <thead className="text-xs text-muted-foreground bg-black/40 border-b border-border font-mono uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Jugador</th>
                <th className="px-3 py-2">Art. 18<br /><span className="text-[10px] normal-case">Posición</span></th>
                <th className="px-3 py-2">Art. 19<br /><span className="text-[10px] normal-case">Clasif.</span></th>
                <th className="px-3 py-2">Art. 19bis<br /><span className="text-[10px] normal-case">Terceros</span></th>
                <th className="px-3 py-2 text-primary font-bold">Total<br /><span className="text-[10px] normal-case">Bonif.</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {rows.map(r => (
                <tr key={r.name} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-left font-bold uppercase">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: r.color }} />
                      {r.name}
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono">{r.art18 > 0 ? <span className="text-green-400 font-bold">+{r.art18}</span> : <span className="text-muted-foreground">0</span>}</td>
                  <td className="px-3 py-3 font-mono">{r.art19 > 0 ? <span className="text-green-400 font-bold">+{r.art19}</span> : <span className="text-muted-foreground">0</span>}</td>
                  <td className="px-3 py-3 font-mono">{r.art19bis > 0 ? <span className="text-green-400 font-bold">+{r.art19bis}</span> : <span className="text-muted-foreground">0</span>}</td>
                  <td className="px-3 py-3 font-bold text-white text-base bg-black/20">{r.total > 0 ? `+${r.total}` : "0"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalle — subtabs */}
      <div>
        <h2 className="text-lg font-bold uppercase text-white border-l-4 border-primary pl-3 mb-3">Detalle</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {groupKeys.map(g => (
            <button key={g} onClick={() => setSubTab(g)}
              className={`w-10 h-10 rounded font-bold font-mono transition-all ${subTab === g
                ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                : "bg-card text-muted-foreground border border-border hover:bg-white/5 hover:text-white"}`}>
              {g}
            </button>
          ))}
          <button onClick={() => setSubTab("TERCEROS")}
            className={`px-3 h-10 rounded font-bold font-mono transition-all text-xs ${subTab === "TERCEROS"
              ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(255,215,0,0.3)]"
              : "bg-card text-muted-foreground border border-border hover:bg-white/5 hover:text-white"}`}>
            3°
          </button>
        </div>

        {/* Group detail */}
        {subTab !== "TERCEROS" && groupDetail && (
          <div className="bg-card border border-border rounded-md overflow-hidden">
            <div className="bg-black/30 px-4 py-2 border-b border-border">
              <span className="font-bold text-primary font-mono">GRUPO {groupDetail.g} — Detalle de pronósticos</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs whitespace-nowrap">
                <thead className="text-muted-foreground bg-black/20 border-b border-border">
                  <tr>
                    <th className="px-2 py-1.5 text-center">Pos</th>
                    <th className="px-3 py-1.5 text-left">Equipo (real)</th>
                    <th className="px-2 py-1.5 text-center">PTS</th>
                    <th className="px-2 py-1.5 text-center">DIF</th>
                    {PARTICIPANTS.map((p, i) => (
                      <th key={p} className="px-3 py-1.5 text-center" style={{ color: COLORS[i] }}>{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {groupDetail.teamRows.map(({ pos, actualTeam, isQualifier, isThird, playerCols }) => {
                    const actualStats = groupDetail.actual[pos];
                    return (
                      <tr key={pos} className={`hover:bg-white/5 ${!isQualifier && !isThird ? "opacity-60" : ""}`}>
                        <td className={`px-2 py-2 text-center font-bold ${isQualifier ? "text-green-400" : isThird ? "text-yellow-400" : "text-muted-foreground"}`}>
                          {pos + 1}{isQualifier && "▲"}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          <div className="flex items-center gap-2">
                            <img src={`https://flagcdn.com/w20/${FLAG_CODE[actualTeam]}.png`} alt="" className="w-4 h-3 rounded-[1px] shadow-sm" onError={e => (e.currentTarget.style.display = "none")} />
                            <span className={isQualifier ? "text-white" : isThird ? "text-yellow-200" : "text-muted-foreground"}>
                              {actualTeam}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground">{actualStats?.pts ?? "—"}</td>
                        <td className="px-2 py-2 text-center text-muted-foreground">
                          {actualStats ? (actualStats.dif > 0 ? `+${actualStats.dif}` : actualStats.dif) : "—"}
                        </td>
                        {playerCols.map(({ name, predTeam, posHit, thirdHit }) => {
                          const anyHit = posHit || thirdHit;
                          const hitColor = posHit ? "text-green-400" : thirdHit ? "text-yellow-400" : "text-muted-foreground";
                          return (
                            <td key={name} className={`px-3 py-2 text-center ${anyHit ? "font-bold" : ""} ${hitColor}`}>
                              <div className="flex items-center justify-center gap-1">
                                <img src={`https://flagcdn.com/w20/${FLAG_CODE[predTeam]}.png`} alt="" className="w-4 h-3 rounded-[1px] shadow-sm" onError={e => (e.currentTarget.style.display = "none")} />
                                {predTeam !== "—" ? shorten(predTeam) : "—"}{posHit ? " ✓" : ""}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-primary/30 bg-black/20">
                    <td colSpan={4} className="px-3 py-2 text-right text-xs text-muted-foreground font-bold uppercase">Art. 18 — Pos. exactas</td>
                    {groupDetail.playerTotals.map(({ name, art18pts }) => (
                      <td key={name} className="px-3 py-2 text-center font-bold text-base" style={{ color: art18pts > 0 ? COLORS[PARTICIPANTS.indexOf(name)] : undefined }}>
                        {art18pts > 0 ? `+${art18pts}` : "0"}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-black/20">
                    <td colSpan={4} className="px-3 py-2 text-right text-xs text-muted-foreground font-bold uppercase">Art. 19 — Clasificados</td>
                    {groupDetail.playerTotals.map(({ name, art19pts }) => (
                      <td key={name} className="px-3 py-2 text-center font-bold text-base" style={{ color: art19pts > 0 ? COLORS[PARTICIPANTS.indexOf(name)] : undefined }}>
                        {art19pts > 0 ? `+${art19pts}` : "0"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Terceros detail */}
        {subTab === "TERCEROS" && (
          <div className="bg-card border border-border rounded-md overflow-hidden">
            <div className="bg-black/30 px-4 py-2 border-b border-border">
              <span className="font-bold text-primary font-mono">MEJORES TERCEROS — Detalle de pronósticos</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs whitespace-nowrap">
                <thead className="text-muted-foreground bg-black/20 border-b border-border">
                  <tr>
                    <th className="px-2 py-1.5 text-center">#</th>
                    <th className="px-3 py-1.5 text-left">Equipo real (Grupo)</th>
                    <th className="px-2 py-1.5 text-center">PTS</th>
                    <th className="px-2 py-1.5 text-center">DIF</th>
                    {PARTICIPANTS.map((p, i) => (
                      <th key={p} className="px-3 py-1.5 text-center" style={{ color: COLORS[i] }}>{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {tercerosDetail.realThirds.map(({ group, team, pts, dif }, idx) => {
                    const qualified = tercerosDetail.qualifiedSet.has(team);
                    return (
                      <tr key={group} className={`hover:bg-white/5 ${qualified ? "" : "opacity-50"}`}>
                        <td className={`px-2 py-2 text-center font-bold ${qualified ? "text-yellow-400" : "text-muted-foreground"}`}>
                          {idx + 1}{qualified && "▲"}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          <div className="flex items-center gap-2">
                            <img src={`https://flagcdn.com/w20/${FLAG_CODE[team]}.png`} alt="" className="w-4 h-3 rounded-[1px] shadow-sm" onError={e => (e.currentTarget.style.display = "none")} />
                            <span className={qualified ? "text-white" : "text-muted-foreground"}>{team}</span>
                            <span className="text-muted-foreground text-[10px]">({group})</span>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground">{pts}</td>
                        <td className="px-2 py-2 text-center text-muted-foreground">{dif > 0 ? `+${dif}` : dif}</td>
                        {tercerosDetail.playerPredictions.map(({ name, playerThirds }) => {
                          const playerTeam = playerThirds[idx]?.team ?? "—";
                          const hit = playerTeam === team;
                          return (
                            <td key={name} className={`px-3 py-2 text-center ${hit ? "text-yellow-400 font-bold" : "text-muted-foreground"}`}>
                              <div className="flex items-center justify-center gap-1">
                                {playerTeam !== "—" && (
                                  <img src={`https://flagcdn.com/w20/${FLAG_CODE[playerTeam]}.png`} alt="" className="w-4 h-3 rounded-[1px] shadow-sm" onError={e => (e.currentTarget.style.display = "none")} />
                                )}
                                {shorten(playerTeam)}{hit ? " ✓" : ""}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-primary/30 bg-black/20">
                    <td colSpan={4} className="px-3 py-2 text-right text-xs text-muted-foreground font-bold uppercase">Total Art. 19bis</td>
                    {tercerosDetail.playerPredictions.map(({ name, totalPts }) => (
                      <td key={name} className="px-3 py-2 text-center font-bold text-base" style={{ color: totalPts > 0 ? COLORS[PARTICIPANTS.indexOf(name)] : undefined }}>
                        {totalPts > 0 ? `+${totalPts}` : "0"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
