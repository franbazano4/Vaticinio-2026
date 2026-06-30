import { FLAG_CODE } from "../data/constants";
import { KNOCKOUT_MATCHES, ROUND_LABELS, RoundId, ResolvedMatch, KnockoutResult } from "../data/knockoutBracket";
import { MAV_FORECASTS, PODIUM_FORECASTS } from "../data/knockoutForecasts";
import { calcKnockoutMatchPoints, calcPlayerKnockoutTotal, calcRondaRelampagoPoints } from "../lib/knockoutLogic";

interface Props {
  player: string;
  resolved: Record<string, ResolvedMatch>;
  results: Record<string, KnockoutResult>;
}

const ROUND_ORDER: RoundId[] = ["R32", "R16", "QF", "SF", "TP", "F"];

function MiniFlag({ name }: { name?: string }) {
  if (!name) return <span className="text-muted-foreground/50">?</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <img
        src={`https://flagcdn.com/w20/${FLAG_CODE[name]}.png`}
        alt=""
        className="w-4 h-3 rounded-[1px] shadow-sm inline-block"
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
      {name}
    </span>
  );
}

export function PlayerBracketView({ player, resolved, results }: Props) {
  const totals = calcPlayerKnockoutTotal(player, resolved, results);
  const relampago = calcRondaRelampagoPoints(player, resolved);
  const podium = PODIUM_FORECASTS[player];

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-md overflow-hidden">
        <div className="bg-black/30 px-4 py-2 border-b border-border flex items-center justify-between">
          <span className="font-bold text-primary font-mono uppercase">Cuadro de {player}</span>
          <span className="font-black text-white text-lg">{totals.total} <span className="text-xs text-muted-foreground font-normal">pts</span></span>
        </div>

        {ROUND_ORDER.map((round) => {
          const matches = KNOCKOUT_MATCHES.filter((m) => m.round === round);
          return (
            <div key={round} className="border-b border-border/50 last:border-b-0">
              <div className="bg-black/10 px-4 py-1.5 text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                {ROUND_LABELS[round]}
              </div>
              <div className="divide-y divide-border/30">
                {matches.map((m) => {
                  const forecast = MAV_FORECASTS[player]?.[m.id];
                  const breakdown = calcKnockoutMatchPoints(player, m.id, resolved, results);
                  const real = resolved[m.id];
                  return (
                    <div key={m.id} className="px-4 py-2 flex items-center justify-between gap-3 text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground/70 font-mono">
                          {forecast ? (
                            <>
                              {forecast.teamA} {forecast.scoreA}-{forecast.scoreB} {forecast.teamB}
                              {forecast.penaltyWinner ? ` (pen. ${forecast.penaltyWinner})` : ""}
                            </>
                          ) : (
                            "Sin vaticinio MAV"
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs mt-0.5">
                          <MiniFlag name={real?.home} /> <span className="text-muted-foreground">vs</span> <MiniFlag name={real?.away} />
                          {results[m.id] && (
                            <span className="font-bold text-white">
                              {results[m.id].score[0]}-{results[m.id].score[1]}
                              {results[m.id].penalties ? ` (pen. ${results[m.id].penalties![0]}-${results[m.id].penalties![1]})` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                        {breakdown.multiplier !== 1 && (
                          <span className="text-[9px] font-bold text-primary/80 bg-primary/10 px-1 rounded">x{breakdown.multiplier}</span>
                        )}
                        {breakdown.played ? (
                          <span className={`text-sm font-black ${breakdown.totalPts > 0 ? "text-green-400" : breakdown.totalPts < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                            {breakdown.totalPts > 0 ? "+" : ""}{breakdown.totalPts}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/50 italic">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {podium && (
        <div className="bg-card border border-border rounded-md overflow-hidden">
          <div className="bg-black/30 px-4 py-2 border-b border-border flex items-center justify-between">
            <span className="font-bold text-primary font-mono uppercase text-sm">Ronda Relámpago — Podio vaticinado</span>
            {relampago.resolved && (
              <span className="font-black text-white">{relampago.total} <span className="text-xs text-muted-foreground font-normal">pts</span></span>
            )}
          </div>
          <div className="p-4 flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span>🥇 1° puesto: <MiniFlag name={podium.first} /></span>
              {relampago.resolved && <span className={`font-bold ${relampago.championPts > 0 ? "text-green-400" : "text-muted-foreground"}`}>+{relampago.championPts}</span>}
            </div>
            <div className="flex items-center justify-between">
              <span>🥈 2° puesto: <MiniFlag name={podium.second} /></span>
              {relampago.resolved && <span className={`font-bold ${relampago.runnerUpPts > 0 ? "text-green-400" : "text-muted-foreground"}`}>+{relampago.runnerUpPts}</span>}
            </div>
            <div className="flex items-center justify-between">
              <span>🥉 3° puesto: <MiniFlag name={podium.third} /></span>
              {relampago.resolved && <span className={`font-bold ${relampago.thirdPts > 0 ? "text-green-400" : "text-muted-foreground"}`}>+{relampago.thirdPts}</span>}
            </div>
            {!relampago.resolved && <p className="text-xs text-muted-foreground italic mt-1">Se calcula al terminar la Final y el partido por el Tercer Puesto.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
