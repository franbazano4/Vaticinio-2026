import { FLAG_CODE, PARTICIPANTS, COLORS, FORECASTS } from "../data/constants";
import { calcPts } from "../lib/logic";

interface Match {
  id: string;
  group: string;
  home: string;
  away: string;
  fecha: string;
  hora: string;
  nota?: string;
}

interface MatchCardProps {
  match: Match;
  realResult?: [number, number];
  allResults: Record<string, [number, number]>;
}

export function MatchCard({ match, realResult }: MatchCardProps) {
  return (
    <div className="bg-card/40 border border-border rounded-md overflow-hidden flex flex-col mb-4">
      <div className="flex justify-between items-center px-3 py-2 bg-black/20 text-xs text-muted-foreground border-b border-border">
        <span>GRUPO {match.group}</span>
        <span>{match.fecha} · {match.hora} hs{match.nota ? ` · *${match.nota}` : ""}</span>
        {realResult && (
          <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold" style={{ fontSize: "10px" }}>
            Jugado
          </span>
        )}
      </div>

      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1">
          <img
            src={`https://flagcdn.com/w40/${FLAG_CODE[match.home]}.png`}
            alt={match.home}
            className="w-8 h-auto shadow-sm rounded-sm"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <span className="font-bold text-base">{match.home}</span>
        </div>

        <div className="flex-shrink-0 mx-4">
          {realResult ? (
            <div className="text-3xl font-black tabular-nums tracking-tighter bg-black/30 px-4 py-1 rounded-md text-primary shadow-inner">
              {realResult[0]} - {realResult[1]}
            </div>
          ) : (
            <div className="text-sm font-mono text-muted-foreground bg-black/20 px-3 py-1 rounded-md border border-border/50">
              vs
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 flex-1 text-right">
          <span className="font-bold text-base">{match.away}</span>
          <img
            src={`https://flagcdn.com/w40/${FLAG_CODE[match.away]}.png`}
            alt={match.away}
            className="w-8 h-auto shadow-sm rounded-sm"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </div>
      </div>

      <div className="bg-black/30 p-3 grid grid-cols-2 md:grid-cols-4 gap-2 border-t border-border">
        {PARTICIPANTS.map((p, i) => {
          const pred = FORECASTS[`${p}_${match.id}`];
          if (!pred) return null;

          const pts = realResult ? calcPts(pred, realResult) : null;

          let bgClass = "bg-black/20";
          let ptsColor = "text-muted-foreground";
          if (pts === 4) { bgClass = "bg-green-400/10 border border-green-400/20"; ptsColor = "text-green-400"; }
          else if (pts === 2) { bgClass = "bg-yellow-400/10 border border-yellow-400/20"; ptsColor = "text-yellow-400"; }
          else if (pts === 0) { bgClass = "bg-red-400/10 border border-red-400/20"; ptsColor = "text-red-400"; }

          return (
            <div key={p} className={`flex items-center justify-between px-2 py-1.5 rounded-sm ${bgClass}`}>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-xs font-semibold">{p}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono tabular-nums">{pred[0]}-{pred[1]}</span>
                {pts !== null && (
                  <span className={`text-[10px] font-black ${ptsColor}`}>+{pts}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
