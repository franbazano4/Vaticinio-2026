import { useState, useEffect } from "react";
import { FLAG_CODE, PARTICIPANTS, COLORS } from "../data/constants";
import { KnockoutMatchDef, ResolvedMatch, KnockoutResult } from "../data/knockoutBracket";
import { MAV_FORECASTS, MatchForecast } from "../data/knockoutForecasts";
import { calcKnockoutMatchPoints } from "../lib/knockoutLogic";

const API_URL = import.meta.env.VITE_API_URL ?? "";

interface Props {
  match: KnockoutMatchDef;
  resolved: ResolvedMatch;
  realResult?: KnockoutResult;
  resolvedAll: Record<string, ResolvedMatch>;
  resultsAll: Record<string, KnockoutResult>;
}

function getScoreForTeam(f: MatchForecast, team: string): number | undefined {
  if (f.teamA === team) return f.scoreA;
  if (f.teamB === team) return f.scoreB;
  return undefined;
}

export function KnockoutMatchCard({ match, resolved, realResult, resolvedAll, resultsAll }: Props) {
  const [probabilities, setProbabilities] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    if (realResult || !resolved.home || !resolved.away) return;

    const scores = new Set<string>();
    for (const p of PARTICIPANTS) {
      const f = MAV_FORECASTS[p]?.[match.id];
      if (f) {
        const hs = getScoreForTeam(f, resolved.home!);
        const as_ = getScoreForTeam(f, resolved.away!);
        if (hs !== undefined && as_ !== undefined) scores.add(`${hs}-${as_}`);
      }
    }
    if (scores.size === 0) return;

    const url = `${API_URL}/api/probabilities?home=${encodeURIComponent(resolved.home!)}&away=${encodeURIComponent(resolved.away!)}&scores=${encodeURIComponent(Array.from(scores).join(","))}&neutral=true`;
    fetch(url)
      .then(r => r.json())
      .then(data => { if (data.probabilities) setProbabilities(data.probabilities); })
      .catch(() => {});
  }, [match.id, resolved.home, resolved.away, realResult]);

  return (
    <div className="bg-card/40 border border-border rounded-md overflow-hidden flex flex-col mb-4">
      {/* Header */}
      <div className="flex justify-between items-center px-3 py-2 bg-black/20 text-xs text-muted-foreground border-b border-border">
        <span>{match.sede ?? ""}</span>
        <span>{match.fecha} · {match.hora} hs</span>
        {resolved.played ? (
          <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold" style={{ fontSize: "10px" }}>Jugado</span>
        ) : (
          <span className="text-muted-foreground/60" style={{ fontSize: "10px" }}>Pendiente</span>
        )}
      </div>

      {/* Teams + Score */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1">
          {resolved.home ? (
            <>
              <img src={`https://flagcdn.com/w40/${FLAG_CODE[resolved.home]}.png`} alt={resolved.home} className="w-8 h-auto shadow-sm rounded-sm" onError={(e) => (e.currentTarget.style.display = "none")} />
              <span className="font-bold text-base">{resolved.home}</span>
            </>
          ) : (
            <span className="text-muted-foreground italic text-sm">Por definir</span>
          )}
        </div>

        <div className="flex-shrink-0 mx-4">
          {realResult ? (
            <div className="text-3xl font-black tabular-nums tracking-tighter bg-black/30 px-4 py-1 rounded-md text-primary shadow-inner">
              {realResult.score[0]} - {realResult.score[1]}
              {realResult.penalties && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({realResult.penalties[0]}-{realResult.penalties[1]})
                </span>
              )}
            </div>
          ) : (
            <div className="text-sm font-mono text-muted-foreground bg-black/20 px-3 py-1 rounded-md border border-border/50">vs</div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 flex-1 text-right">
          {resolved.away ? (
            <>
              <span className="font-bold text-base">{resolved.away}</span>
              <img src={`https://flagcdn.com/w40/${FLAG_CODE[resolved.away]}.png`} alt={resolved.away} className="w-8 h-auto shadow-sm rounded-sm" onError={(e) => (e.currentTarget.style.display = "none")} />
            </>
          ) : (
            <span className="text-muted-foreground italic text-sm">Por definir</span>
          )}
        </div>
      </div>

      {/* Player forecasts */}
      <div className="bg-black/30 p-3 grid grid-cols-2 md:grid-cols-4 gap-2 border-t border-border">
        {PARTICIPANTS.map((p, i) => {
          const breakdown = calcKnockoutMatchPoints(p, match.id, resolvedAll, resultsAll);
          const f = breakdown.activeForecast;

          const pts = breakdown.played ? breakdown.totalPts : null;

          let homeScore: number | undefined;
          let awayScore: number | undefined;
          let isPredDraw = false;
          let penWinner: string | undefined;

          if (f && resolved.home && resolved.away) {
            homeScore = getScoreForTeam(f, resolved.home);
            awayScore = getScoreForTeam(f, resolved.away);
            if (homeScore !== undefined && awayScore !== undefined) {
              isPredDraw = homeScore === awayScore;
              penWinner = f.penaltyWinner;
            }
          }

          const scoreKey = homeScore !== undefined && awayScore !== undefined ? `${homeScore}-${awayScore}` : null;
          const prob = !realResult && probabilities && scoreKey ? probabilities[scoreKey] : null;

          let bgClass = "bg-black/20";
          let ptsColor = "text-muted-foreground";
          if (pts !== null) {
            const sign = breakdown.signPts;
            if (sign >= 4) { bgClass = "bg-green-400/10 border border-green-400/20"; ptsColor = "text-green-400"; }
            else if (sign >= 2) { bgClass = "bg-yellow-400/10 border border-yellow-400/20"; ptsColor = "text-yellow-400"; }
            else { bgClass = "bg-red-400/10 border border-red-400/20"; ptsColor = "text-red-400"; }
          }

          return (
            <div key={p} className={`flex items-center justify-between px-2 py-1.5 rounded-sm ${bgClass}`}>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-xs font-semibold">{p}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {homeScore !== undefined && awayScore !== undefined ? (
                  <span className="text-xs font-mono tabular-nums">
                    <span className={isPredDraw && penWinner === resolved.home ? "text-yellow-400" : ""}>{homeScore}</span>
                    {"-"}
                    <span className={isPredDraw && penWinner === resolved.away ? "text-yellow-400" : ""}>{awayScore}</span>
                    {isPredDraw && (
                      <span className="text-muted-foreground">
                        {realResult?.penalties
                          ? ` (${realResult.penalties[0]}-${realResult.penalties[1]})`
                          : penWinner ? ` (${penWinner})` : ""}
                      </span>
                    )}
                  </span>
                ) : breakdown.participantsKnown ? (
                  <span className="text-[10px] text-yellow-400/80 italic">—</span>
                ) : null}

                {breakdown.multiplier !== 1 && (
                  <span className="text-[9px] font-bold text-primary/80 bg-primary/10 px-1 rounded">x{breakdown.multiplier}</span>
                )}

                {pts !== null ? (
                  <span className={`text-[10px] font-black ${ptsColor}`}>{pts > 0 ? "+" : ""}{pts}</span>
                ) : prob !== null ? (
                  <span className="text-[10px] font-mono text-muted-foreground/70">
                    {prob < 0.1 ? "<0.1" : prob.toFixed(1)}%
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
