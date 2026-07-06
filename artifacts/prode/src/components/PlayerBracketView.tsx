import { FLAG_CODE } from "../data/constants";
import { KNOCKOUT_MATCH_BY_ID, ROUND_LABELS, ResolvedMatch, KnockoutMatchDef } from "../data/knockoutBracket";
import { MAV_FORECASTS, MatchForecast } from "../data/knockoutForecasts";
import { calcMavMultiplier } from "../lib/knockoutLogic";

interface Props {
  player: string;
  resolved: Record<string, ResolvedMatch>;
}

const BOX_W = 168;

function Flag({ team }: { team: string }) {
  return (
    <img
      src={`https://flagcdn.com/w20/${FLAG_CODE[team]}.png`}
      alt=""
      className="w-4 h-3 rounded-[1px] shadow-sm flex-shrink-0 object-cover"
      onError={(e) => (e.currentTarget.style.display = "none")}
    />
  );
}

function pickWinner(f: MatchForecast): string | undefined {
  if (f.scoreA > f.scoreB) return f.teamA;
  if (f.scoreB > f.scoreA) return f.teamB;
  return f.penaltyWinner;
}

// ¿Puede "team" todavía llegar a este lado (home/away) de este partido?
// Recorre la cadena homeFrom/awayFrom hacia atrás hasta toparse con un
// partido ya jugado (ahí queda fijo quién pasó) o con un cruce de
// Dieciseisavos (equipos fijos de entrada). Si en el camino un partido ya
// jugado dice que "team" perdió (o no era parte de ese cruce), el equipo
// queda descartado para este lado aunque el partido que nos interesa
// todavía no se haya jugado.
function canReachSide(match: KnockoutMatchDef, side: "home" | "away", team: string, resolved: Record<string, ResolvedMatch>): boolean {
  const fixed = side === "home" ? match.home : match.away;
  if (fixed) return fixed === team;
  const src = side === "home" ? match.homeFrom : match.awayFrom;
  if (!src) return false;
  const srcResolved = resolved[src.matchId];
  if (srcResolved?.played) {
    const determined = src.take === "winner" ? srcResolved.winner : srcResolved.loser;
    return determined === team;
  }
  return teamStillAlive(team, src.matchId, resolved);
}

function teamStillAlive(team: string, matchId: string, resolved: Record<string, ResolvedMatch>): boolean {
  const match = KNOCKOUT_MATCH_BY_ID[matchId];
  return canReachSide(match, "home", team, resolved) || canReachSide(match, "away", team, resolved);
}

// Estado de la cadena MAV para este cruce, en base a lo que ya se sabe del cuadro real:
// - "impossible": ya sabemos que este cruce específico no puede pasar — o porque ya se
//   jugó y no coincidió, o porque alguno de los dos equipos vaticinados ya quedó
//   eliminado en una ronda anterior (aunque este partido en particular no se haya jugado).
// - "hit": los dos equipos vaticinados son, confirmado, los que juegan este cruce.
// - "pending": todavía puede pasar (ambos equipos vaticinados siguen con vida).
function getMavStatus(matchId: string, forecast: MatchForecast | undefined, resolved: Record<string, ResolvedMatch>): "impossible" | "hit" | "pending" {
  if (!forecast) return "impossible";
  const real = resolved[matchId];
  if (real?.home && real?.away) {
    const realSet = new Set([real.home, real.away]);
    const hit = realSet.size === 2 && realSet.has(forecast.teamA) && realSet.has(forecast.teamB) && forecast.teamA !== forecast.teamB;
    return hit ? "hit" : "impossible";
  }
  const aAlive = teamStillAlive(forecast.teamA, matchId, resolved);
  const bAlive = teamStillAlive(forecast.teamB, matchId, resolved);
  return aAlive && bAlive ? "pending" : "impossible";
}

function MatchBox({ matchId, player, resolved }: { matchId: string; player: string; resolved: Record<string, ResolvedMatch> }) {
  const match = KNOCKOUT_MATCH_BY_ID[matchId];
  const f = MAV_FORECASTS[player]?.[matchId];

  if (!f) {
    return (
      <div
        style={{ width: BOX_W }}
        className="flex-shrink-0 bg-card/50 border border-dashed border-border/70 rounded-md px-2.5 py-3 text-[10px] text-muted-foreground italic text-center"
      >
        Sin vaticinio MAV
      </div>
    );
  }

  const winner = pickWinner(f);
  const isDraw = f.scoreA === f.scoreB;
  const rows: Array<{ team: string; score: number; penScore?: number }> = [
    { team: f.teamA, score: f.scoreA, penScore: f.penaltyScoreA },
    { team: f.teamB, score: f.scoreB, penScore: f.penaltyScoreB },
  ];

  // La Final y el Tercer Puesto tienen multiplicador fijo (no dependen de la
  // cadena MAV), así que no se marcan con el código de colores.
  const trackChances = match.round !== "F" && match.round !== "TP";
  const status = trackChances ? getMavStatus(matchId, f, resolved) : null;
  const multiplier = status === "hit" ? calcMavMultiplier(matchId, player, resolved) : null;

  const boxBorderClass =
    status === "impossible" ? "border-border/40 opacity-50 grayscale"
    : status === "hit" ? "border-green-400/50"
    : status === "pending" ? "border-green-400/25"
    : "border-border";

  const boxBgClass = status === "hit" ? "bg-green-400/5" : "bg-card";

  return (
    <div style={{ width: BOX_W }} className={`flex-shrink-0 border rounded-md overflow-hidden shadow-sm ${boxBorderClass} ${boxBgClass}`}>
      <div className="flex items-center justify-between px-2 py-1 bg-black/25 border-b border-border/60">
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">{ROUND_LABELS[match.round]}</span>
        <div className="flex items-center gap-1">
          {multiplier !== null && multiplier > 1 && (
            <span className="text-[9px] font-black text-green-400">×{multiplier}</span>
          )}
          <span className="text-[9px] text-muted-foreground/50 font-mono">{match.fecha}</span>
        </div>
      </div>
      <div className="divide-y divide-border/40">
        {rows.map((r, idx) => {
          const isWinner = winner === r.team;
          return (
            <div key={idx} className={`flex items-center gap-1.5 px-2 py-1.5 ${isWinner ? "bg-primary/10" : ""}`}>
              <Flag team={r.team} />
              <span className={`flex-1 text-[11px] leading-tight truncate ${isWinner ? "font-bold text-primary" : "text-white/80"}`}>
                {r.team}
              </span>
              <span className={`text-xs font-mono font-black tabular-nums ${isWinner ? "text-primary" : "text-muted-foreground"}`}>
                {r.score}
                {isDraw && r.penScore !== undefined && (
                  <span className="text-[10px] font-bold text-primary/70"> ({r.penScore})</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Elbow() {
  return (
    <div className="flex flex-col w-3 flex-shrink-0 self-stretch">
      <div className="flex-1 border-b border-r border-border/60 rounded-br-[3px]" />
      <div className="flex-1 border-t border-r border-border/60 rounded-tr-[3px]" />
    </div>
  );
}

// Recorre el cuadro de atrás para adelante (Dieciseisavos -> Final) usando la
// estructura real de cruces (homeFrom/awayFrom), no el orden de la lista de
// partidos. Así cada casillero queda conectado visualmente con el que le sigue.
function BracketNode({ matchId, player, resolved }: { matchId: string; player: string; resolved: Record<string, ResolvedMatch> }) {
  const match = KNOCKOUT_MATCH_BY_ID[matchId];
  const homeSrc = match.homeFrom?.matchId;
  const awaySrc = match.awayFrom?.matchId;
  const hasChildren = Boolean(homeSrc && awaySrc);

  return (
    <div className="flex items-stretch gap-2">
      {hasChildren && (
        <>
          <div className="flex flex-col justify-center gap-3">
            <BracketNode matchId={homeSrc!} player={player} resolved={resolved} />
            <BracketNode matchId={awaySrc!} player={player} resolved={resolved} />
          </div>
          <Elbow />
        </>
      )}
      <div className="self-center">
        <MatchBox matchId={matchId} player={player} resolved={resolved} />
      </div>
    </div>
  );
}

export function PlayerBracketView({ player, resolved }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] text-muted-foreground/60 italic sm:hidden">Deslizá para ver el cuadro completo →</p>

      <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground/70">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm border border-green-400/50 bg-green-400/5" /> Con chance / confirmado</span>
        <span className="flex items-center gap-1"><span className="text-green-400 font-black">×N</span> Multiplicador ya confirmado</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm border border-border/40 opacity-50 grayscale bg-card" /> Sin chance</span>
      </div>

      <div className="overflow-x-auto no-scrollbar -mx-1 px-1 pb-2">
        <div className="inline-flex min-w-max py-1">
          <BracketNode matchId="M104" player={player} resolved={resolved} />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1 border-t border-border/40">
        <span className="text-[10px] font-bold uppercase text-muted-foreground/70 tracking-wider whitespace-nowrap">🥉 Tercer puesto</span>
        <MatchBox matchId="M103" player={player} resolved={resolved} />
      </div>
    </div>
  );
}
