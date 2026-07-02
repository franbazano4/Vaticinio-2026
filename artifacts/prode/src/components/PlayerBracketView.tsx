import { FLAG_CODE } from "../data/constants";
import { KNOCKOUT_MATCH_BY_ID, ROUND_LABELS } from "../data/knockoutBracket";
import { MAV_FORECASTS, MatchForecast } from "../data/knockoutForecasts";

interface Props {
  player: string;
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

function MatchBox({ matchId, player }: { matchId: string; player: string }) {
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

  return (
    <div style={{ width: BOX_W }} className="flex-shrink-0 bg-card border border-border rounded-md overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-2 py-1 bg-black/25 border-b border-border/60">
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">{ROUND_LABELS[match.round]}</span>
        <span className="text-[9px] text-muted-foreground/50 font-mono">{match.fecha}</span>
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
function BracketNode({ matchId, player }: { matchId: string; player: string }) {
  const match = KNOCKOUT_MATCH_BY_ID[matchId];
  const homeSrc = match.homeFrom?.matchId;
  const awaySrc = match.awayFrom?.matchId;
  const hasChildren = Boolean(homeSrc && awaySrc);

  return (
    <div className="flex items-stretch gap-2">
      {hasChildren && (
        <>
          <div className="flex flex-col justify-center gap-3">
            <BracketNode matchId={homeSrc!} player={player} />
            <BracketNode matchId={awaySrc!} player={player} />
          </div>
          <Elbow />
        </>
      )}
      <div className="self-center">
        <MatchBox matchId={matchId} player={player} />
      </div>
    </div>
  );
}

export function PlayerBracketView({ player }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] text-muted-foreground/60 italic sm:hidden">Deslizá para ver el cuadro completo →</p>

      <div className="overflow-x-auto no-scrollbar -mx-1 px-1 pb-2">
        <div className="inline-flex min-w-max py-1">
          <BracketNode matchId="M104" player={player} />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1 border-t border-border/40">
        <span className="text-[10px] font-bold uppercase text-muted-foreground/70 tracking-wider whitespace-nowrap">🥉 Tercer puesto</span>
        <MatchBox matchId="M103" player={player} />
      </div>
    </div>
  );
}
