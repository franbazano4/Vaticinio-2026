import React from "react";
import { TeamStats } from "../lib/logic";
import { FLAG_CODE } from "../data/constants";

interface StandingsTableProps {
  teams: TeamStats[];
  showGroup?: boolean;
}

export function StandingsTable({ teams, showGroup }: StandingsTableProps) {
  return (
    <div className="overflow-x-auto bg-card border border-border rounded-md shadow-sm">
      <table className="w-full text-sm text-left whitespace-nowrap">
        <thead className="text-xs text-muted-foreground bg-black/40 border-b border-border font-mono uppercase">
          <tr>
            <th scope="col" className="px-3 py-2 text-center w-8">#</th>
            <th scope="col" className="px-3 py-2">Equipo</th>
            <th scope="col" className="px-2 py-2 text-center" title="Partidos Jugados">PJ</th>
            <th scope="col" className="px-2 py-2 text-center" title="Ganados">G</th>
            <th scope="col" className="px-2 py-2 text-center" title="Empatados">E</th>
            <th scope="col" className="px-2 py-2 text-center" title="Perdidos">P</th>
            <th scope="col" className="px-2 py-2 text-center hidden sm:table-cell" title="Goles a Favor">GF</th>
            <th scope="col" className="px-2 py-2 text-center hidden sm:table-cell" title="Goles en Contra">GC</th>
            <th scope="col" className="px-2 py-2 text-center" title="Diferencia de Gol">DIF</th>
            <th scope="col" className="px-3 py-2 text-center text-primary font-bold">PTS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {teams.map((team, idx) => {
            const isQualified = showGroup ? false : idx < 2; // For Terceros table we show a mark differently later, this is just for group
            return (
              <tr key={team.name} className={`hover:bg-white/5 transition-colors ${idx < 2 ? 'bg-primary/5' : ''}`}>
                <td className="px-3 py-2 text-center font-mono">
                  {idx + 1}
                  {idx < 2 && <span className="text-primary ml-1 text-[10px]">▲</span>}
                </td>
                <td className="px-3 py-2 font-medium flex items-center gap-2">
                  <img src={`https://flagcdn.com/w20/${FLAG_CODE[team.name]}.png`} alt="" className="w-4 h-3 rounded-[1px] shadow-sm" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  {team.name} {showGroup && <span className="text-xs text-muted-foreground ml-1">({team.name})</span> /* Not strictly needed but ok */}
                </td>
                <td className="px-2 py-2 text-center text-muted-foreground">{team.pj}</td>
                <td className="px-2 py-2 text-center text-muted-foreground">{team.g}</td>
                <td className="px-2 py-2 text-center text-muted-foreground">{team.e}</td>
                <td className="px-2 py-2 text-center text-muted-foreground">{team.p}</td>
                <td className="px-2 py-2 text-center text-muted-foreground hidden sm:table-cell">{team.gf}</td>
                <td className="px-2 py-2 text-center text-muted-foreground hidden sm:table-cell">{team.gc}</td>
                <td className="px-2 py-2 text-center text-muted-foreground">{team.dif > 0 ? `+${team.dif}` : team.dif}</td>
                <td className="px-3 py-2 text-center font-bold text-white bg-black/20">{team.pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
