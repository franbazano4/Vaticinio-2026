import { useMemo } from "react";
import { PARTICIPANTS, COLORS, FLAG_CODE } from "../data/constants";
import { resolveKnockoutBracket, KnockoutResult } from "../data/knockoutBracket";
import { PODIUM_FORECASTS } from "../data/knockoutForecasts";
import { calcRondaRelampagoPoints } from "../lib/knockoutLogic";

interface Props {
  knockoutResults: Record<string, KnockoutResult>;
}

function FlagName({ name }: { name?: string }) {
  if (!name) return <span className="text-muted-foreground italic">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
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

export function RondaRelampagoTab({ knockoutResults }: Props) {
  const resolved = useMemo(() => resolveKnockoutBracket(knockoutResults), [knockoutResults]);
  const final = resolved["M104"];
  const tercer = resolved["M103"];

  const rows = PARTICIPANTS.map((p, i) => ({
    name: p,
    color: COLORS[i],
    podium: PODIUM_FORECASTS[p],
    score: calcRondaRelampagoPoints(p, resolved),
  })).sort((a, b) => b.score.total - a.score.total);

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-md overflow-hidden">
        <div className="bg-black/30 px-4 py-2 border-b border-border">
          <span className="font-bold text-primary font-mono uppercase text-sm">Resultado real</span>
        </div>
        <div className="p-4 grid grid-cols-3 gap-3 text-center text-sm">
          <div>
            <p className="text-muted-foreground text-xs uppercase mb-1">🥇 Campeón</p>
            <FlagName name={final?.winner} />
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase mb-1">🥈 Subcampeón</p>
            <FlagName name={final?.loser} />
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase mb-1">🥉 Tercer puesto</p>
            <FlagName name={tercer?.winner} />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-card border border-border rounded-md shadow-sm">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-muted-foreground bg-black/40 border-b border-border font-mono uppercase">
            <tr>
              <th className="px-4 py-2">Puesto</th>
              {rows.map(({ name, color }) => (
                <th key={name} className="px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    {name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            <tr className="hover:bg-white/5 transition-colors">
              <td className="px-4 py-2.5 font-bold">1°</td>
              {rows.map(({ name, podium, score }) => (
                <td key={name} className={`px-3 py-2.5 text-center ${score.championPts > 0 ? "text-green-400 font-bold" : ""}`}>
                  <FlagName name={podium?.first} />
                </td>
              ))}
            </tr>
            <tr className="hover:bg-white/5 transition-colors">
              <td className="px-4 py-2.5 font-bold">2°</td>
              {rows.map(({ name, podium, score }) => (
                <td key={name} className={`px-3 py-2.5 text-center ${score.runnerUpPts > 0 ? "text-green-400 font-bold" : ""}`}>
                  <FlagName name={podium?.second} />
                </td>
              ))}
            </tr>
            <tr className="hover:bg-white/5 transition-colors">
              <td className="px-4 py-2.5 font-bold">3°</td>
              {rows.map(({ name, podium, score }) => (
                <td key={name} className={`px-3 py-2.5 text-center ${score.thirdPts > 0 ? "text-green-400 font-bold" : ""}`}>
                  <FlagName name={podium?.third} />
                </td>
              ))}
            </tr>
            <tr className="hover:bg-white/5 transition-colors">
              <td className="px-4 py-2.5 font-bold text-primary">PTS</td>
              {rows.map(({ name, score }) => (
                <td key={name} className="px-3 py-2.5 text-center font-black text-white bg-black/20">
                  {score.resolved ? score.total : "—"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
