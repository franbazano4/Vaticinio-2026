import { useState, useEffect } from "react";
import { FLAG_CODE, PARTICIPANTS, COLORS } from "../data/constants";
import { KnockoutMatchDef, ResolvedMatch, KnockoutResult, ROUND_LABELS } from "../data/knockoutBracket";
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

function countryCodeToEmoji(code: string): string {
  const base = code.split("-")[0];
  return base
    .toUpperCase()
    .split("")
    .map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
    .join("");
}

function shareKnockoutMatch(
  matchId: string,
  home: string,
  away: string,
  probabilities: Record<string, number> | null,
) {
  const homeFlag = countryCodeToEmoji(FLAG_CODE[home] ?? "");
  const awayFlag = countryCodeToEmoji(FLAG_CODE[away] ?? "");
  const lines = [`${homeFlag} vs ${awayFlag}`];
  for (const p of PARTICIPANTS) {
    const f = MAV_FORECASTS[p]?.[matchId];
    if (f) {
      const hs = getScoreForTeam(f, home);
      const as_ = getScoreForTeam(f, away);
      if (hs !== undefined && as_ !== undefined) {
        const scoreKey = `${hs}-${as_}`;
        const prob = probabilities ? probabilities[scoreKey] : null;
        const probStr = prob !== null && prob !== undefined
          ? ` (${prob < 0.1 ? "<0.1" : prob.toFixed(1)}%)`
          : "";
        lines.push(`${p}: ${hs}-${as_}${probStr}`);
      }
    }
  }
  const text = encodeURIComponent(lines.join("\n"));
  window.open(`https://wa.me/?text=${text}`, "_blank");
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
        <span className="font-semibold text-white/70">{ROUND_LABELS[match.round]}</span>
        <span>{match.fecha} · {match.hora} hs</span>
        <div className="flex items-center gap-2">
          {resolved.played ? (
            <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold" style={{ fontSize: "10px" }}>Jugado</span>
          ) : resolved.home && resolved.away ? (
            <button
              onClick={() => shareKnockoutMatch(match.id, resolved.home!, resolved.away!, probabilities)}
              title="Compartir pronósticos"
              className="text-muted-foreground hover:text-green-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.534 5.858L.057 23.215a.75.75 0 0 0 .916.916l5.357-1.477A11.955 11.955 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.699-.504-5.25-1.385l-.372-.217-3.863 1.065 1.065-3.863-.217-.372A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
            </button>
          ) : (
            <span className="text-muted-foreground/60" style={{ fontSize: "10px" }}>Pendiente</span>
          )}
        </div>
      </div>

      {/* Teams + Score */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
          {resolved.home ? (
            <>
              <img src={`https://flagcdn.com/w40/${FLAG_CODE[resolved.home]}.png`} alt={resolved.home} className="w-8 h-auto shadow-sm rounded-sm flex-shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />
              <span className="font-bold text-sm sm:text-base truncate">{resolved.home}</span>
            </>
          ) : (
            <span className="text-muted-foreground italic text-sm">Por definir</span>
          )}
        </div>

        <div className="flex-shrink-0 mx-2 sm:mx-4">
          {realResult ? (
            <div className="flex flex-col items-center bg-black/30 px-2 sm:px-4 py-1 rounded-md shadow-inner">
              <span className="text-lg sm:text-3xl font-black tabular-nums tracking-tighter text-primary">
                {realResult.score[0]} - {realResult.score[1]}
              </span>
              {realResult.penalties && (
                <span className="text-xs font-mono text-muted-foreground">
                  ({realResult.penalties[0]}-{realResult.penalties[1]})
                </span>
              )}
            </div>
          ) : (
            <div className="text-sm font-mono text-muted-foreground bg-black/20 px-3 py-1 rounded-md border border-border/50">vs</div>
          )}
        </div>

        <div className="flex items-center justify-end gap-1.5 sm:gap-3 flex-1 text-right min-w-0">
          {resolved.away ? (
            <>
              <span className="font-bold text-sm sm:text-base truncate">{resolved.away}</span>
              <img src={`https://flagcdn.com/w40/${FLAG_CODE[resolved.away]}.png`} alt={resolved.away} className="w-8 h-auto shadow-sm rounded-sm flex-shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />
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

          if (f && resolved.home && resolved.away) {
            homeScore = getScoreForTeam(f, resolved.home);
            awayScore = getScoreForTeam(f, resolved.away);
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
                  <span className="text-xs font-mono tabular-nums">{homeScore}-{awayScore}</span>
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
