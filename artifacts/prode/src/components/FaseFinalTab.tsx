import { useState, useMemo } from "react";
import { PARTICIPANTS, COLORS } from "../data/constants";
import { KNOCKOUT_MATCHES, ROUND_LABELS, RoundId, resolveKnockoutBracket, KnockoutResult } from "../data/knockoutBracket";
import { KnockoutMatchCard } from "./KnockoutMatchCard";
import { PlayerBracketView } from "./PlayerBracketView";

interface Props {
  knockoutResults: Record<string, KnockoutResult>;
}

type SubTab = "CUADROS" | RoundId;

const ROUND_TABS: RoundId[] = ["R32", "R16", "QF", "SF", "TP", "F"];

export function FaseFinalTab({ knockoutResults }: Props) {
  const [subTab, setSubTab] = useState<SubTab>("CUADROS");
  const [selectedPlayer, setSelectedPlayer] = useState<string>(PARTICIPANTS[0]);

  const resolved = useMemo(() => resolveKnockoutBracket(knockoutResults), [knockoutResults]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <button
          onClick={() => setSubTab("CUADROS")}
          className={`px-3 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
            subTab === "CUADROS" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border hover:text-white"
          }`}
        >
          Cuadros
        </button>
        {ROUND_TABS.map((r) => (
          <button
            key={r}
            onClick={() => setSubTab(r)}
            className={`px-3 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
              subTab === r ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border hover:text-white"
            }`}
          >
            {ROUND_LABELS[r]}
          </button>
        ))}
      </div>

      {subTab === "CUADROS" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PARTICIPANTS.map((p, i) => (
              <button
                key={p}
                onClick={() => setSelectedPlayer(p)}
                className={`flex items-center gap-2 px-3 py-2 rounded font-bold text-sm transition-all ${
                  selectedPlayer === p ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(255,215,0,0.3)]" : "bg-card text-muted-foreground border border-border hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                {p}
              </button>
            ))}
          </div>
          <PlayerBracketView player={selectedPlayer} />
        </div>
      )}

      {subTab !== "CUADROS" && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold uppercase text-white border-l-4 border-primary pl-3">{ROUND_LABELS[subTab]}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {KNOCKOUT_MATCHES.filter((m) => m.round === subTab).map((m) => (
              <KnockoutMatchCard
                key={m.id}
                match={m}
                resolved={resolved[m.id]}
                realResult={knockoutResults[m.id]}
                resolvedAll={resolved}
                resultsAll={knockoutResults}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
