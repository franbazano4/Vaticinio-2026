import { FLAG_CODE, PARTICIPANTS, COLORS } from "../data/constants";
import { KnockoutMatchDef, ResolvedMatch, KnockoutResult } from "../data/knockoutBracket";
import { calcKnockoutMatchPoints } from "../lib/knockoutLogic";

interface Props {
  match: KnockoutMatchDef;
  resolved: ResolvedMatch;
  realResult?: KnockoutResult;
  resolvedAll: Record<string, ResolvedMatch>;
  resultsAll: Record<string, KnockoutResult>;
}

function TeamLabel({ name, flagSize = "w-7" }: { name?: string; flagSize?: string }) {
  if (!name) {
    return <span className="text-muted-foreground italic text-sm">Por definir</span>;
  }
  return (
    <div className="flex items-center gap-2">
      <img
        src={`https://flagcdn.com/w40/${FLAG_CODE[name]}.png`}
        alt={name}
        className={`${flagSize} h-auto shadow-sm rounded-sm`}
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
      <span className="font-bold text-base">{name}</span>
    </div>
  );
}

export function KnockoutMatchCard({ match, resolved, realResult, resolvedAll, resultsAll }: Props) {
  const fmtScore = (s?: [number, number], pen?: [number, number]) =>
    s ? `${s[0]}-${s[1]}${pen ? ` (pen. ${pen[0]}-${pen[1]})` : ""}` : "vs";

  return (
    <div className="bg-card/40 border border-border rounded-md overflow-hidden flex flex-col mb-4">
      <div className="flex justify-between items-center px-3 py-2 bg-black/20 text-xs text-muted-foreground border-b border-border">
        <span>{match.sede ?? ""}</span>
        <span>{match.fecha} · {match.hora} hs</span>
        {resolved.played ? (
          <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold" style={{ fontSize: "10px" }}>
            Jugado
          </span>
        ) : (
          <span className="text-muted-foreground/60" style={{ fontSize: "10px" }}>Pendiente</span>
        )}
      </div>

      <div className="flex items-center justify-between p-4">
        <div className="flex-1"><TeamLabel name={resolved.home} /></div>
        <div className="flex-shrink-0 mx-4">
          {realResult ? (
            <div className="text-2xl font-black tabular-nums tracking-tighter bg-black/30 px-4 py-1 rounded-md text-primary shadow-inner">
              {fmtScore(realResult.score, realResult.penalties)}
            </div>
          ) : (
            <div className="text-sm font-mono text-muted-foreground bg-black/20 px-3 py-1 rounded-md border border-border/50">
              vs
            </div>
          )}
        </div>
        <div className="flex-1 flex justify-end"><TeamLabel name={resolved.away} /></div>
      </div>

      <div className="bg-black/30 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-border">
        {PARTICIPANTS.map((p, i) => {
          const breakdown = calcKnockoutMatchPoints(p, match.id, resolvedAll, resultsAll);
          const f = breakdown.activeForecast;

          let bgClass = "bg-black/20";
          if (breakdown.played) {
            if (breakdown.totalPts > 0) bgClass = "bg-green-400/10 border border-green-400/20";
            else if (breakdown.totalPts < 0) bgClass = "bg-red-400/10 border border-red-400/20";
          }

          return (
            <div key={p} className={`flex items-center justify-between px-2 py-1.5 rounded-sm ${bgClass}`}>
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-xs font-semibold flex-shrink-0">{p}</span>
                {f ? (
                  <span className="text-[10px] font-mono text-muted-foreground truncate">
                    {f.teamA} {f.scoreA}-{f.scoreB} {f.teamB}
                    {f.penaltyWinner ? ` (pen. ${f.penaltyWinner})` : ""}
                  </span>
                ) : breakdown.participantsKnown ? (
                  <span className="text-[10px] text-yellow-400/80 italic">Falta vaticinio</span>
                ) : (
                  <span className="text-[10px] text-muted-foreground/60 italic">—</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {breakdown.multiplier !== 1 && (
                  <span className="text-[9px] font-bold text-primary/80 bg-primary/10 px-1 rounded">x{breakdown.multiplier}</span>
                )}
                {breakdown.played && (
                  <span className={`text-[10px] font-black ${breakdown.totalPts > 0 ? "text-green-400" : breakdown.totalPts < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                    {breakdown.totalPts > 0 ? "+" : ""}{breakdown.totalPts}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
