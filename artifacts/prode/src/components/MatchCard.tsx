import React, { useState } from "react";
import { FLAG_CODE, PARTICIPANTS, COLORS, FORECASTS } from "../data/constants";
import { calcPts } from "../lib/logic";
import { useSaveResults } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetResultsQueryKey } from "@workspace/api-client-react";

interface Match {
  id: string;
  group: string;
  home: string;
  away: string;
  fecha: string;
  hora: string;
}

interface MatchCardProps {
  match: Match;
  realResult?: [number, number];
  allResults: Record<string, [number, number]>;
}

export function MatchCard({ match, realResult, allResults }: MatchCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [homeScore, setHomeScore] = useState<string>(realResult ? String(realResult[0]) : "");
  const [awayScore, setAwayScore] = useState<string>(realResult ? String(realResult[1]) : "");
  const queryClient = useQueryClient();
  
  const saveMutation = useSaveResults({
    mutation: {
      onSuccess: () => {
        setIsEditing(false);
        queryClient.invalidateQueries({ queryKey: getGetResultsQueryKey() });
      }
    }
  });

  const handleSave = () => {
    if (homeScore === "" || awayScore === "") return;
    const newResults = { ...allResults };
    newResults[match.id] = [Number(homeScore), Number(awayScore)];
    saveMutation.mutate({ data: { results: newResults } });
  };

  return (
    <div className="bg-card/40 border border-border rounded-md overflow-hidden flex flex-col mb-4">
      {/* Header */}
      <div className="flex justify-between items-center px-3 py-2 bg-black/20 text-xs text-muted-foreground border-b border-border">
        <span>GRUPO {match.group}</span>
        <span>{match.fecha} - {match.hora}</span>
        {realResult && <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold" style={{fontSize: '10px'}}>Jugado</span>}
      </div>

      {/* Main Score Area */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1">
          <img src={`https://flagcdn.com/w40/${FLAG_CODE[match.home]}.png`} alt="" className="w-8 h-auto shadow-sm rounded-sm" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <span className="font-bold text-lg">{match.home}</span>
        </div>
        
        <div className="flex-shrink-0 mx-4 cursor-pointer" onClick={() => !isEditing && setIsEditing(true)}>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input type="number" value={homeScore} onChange={e => setHomeScore(e.target.value)} className="w-12 text-center bg-input border border-border rounded text-white p-1" />
              <span>-</span>
              <input type="number" value={awayScore} onChange={e => setAwayScore(e.target.value)} className="w-12 text-center bg-input border border-border rounded text-white p-1" />
              <button onClick={(e) => { e.stopPropagation(); handleSave(); }} className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs ml-2 font-bold" disabled={saveMutation.isPending}>OK</button>
            </div>
          ) : realResult ? (
            <div className="text-3xl font-black tabular-nums tracking-tighter bg-black/30 px-4 py-1 rounded-md text-primary shadow-inner">
              {realResult[0]} - {realResult[1]}
            </div>
          ) : (
            <div className="text-sm font-mono text-muted-foreground bg-black/20 px-3 py-1 rounded-md border border-border/50">vs</div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 flex-1 text-right">
          <span className="font-bold text-lg">{match.away}</span>
          <img src={`https://flagcdn.com/w40/${FLAG_CODE[match.away]}.png`} alt="" className="w-8 h-auto shadow-sm rounded-sm" onError={(e) => (e.currentTarget.style.display = 'none')} />
        </div>
      </div>

      {/* Predictions */}
      <div className="bg-black/30 p-3 grid grid-cols-2 md:grid-cols-4 gap-2 border-t border-border">
        {PARTICIPANTS.map((p, i) => {
          const pred = FORECASTS[`${p}_${match.id}`];
          if (!pred) return null;
          
          let pts = 0;
          if (realResult) {
            pts = calcPts(pred, realResult);
          }

          let ptsColor = "text-muted-foreground";
          let bgClass = "bg-black/20";
          if (realResult) {
            if (pts === 4) { ptsColor = "text-green-400"; bgClass = "bg-green-400/10 border border-green-400/20"; }
            else if (pts === 2) { ptsColor = "text-yellow-400"; bgClass = "bg-yellow-400/10 border border-yellow-400/20"; }
            else { ptsColor = "text-red-400"; bgClass = "bg-red-400/10 border border-red-400/20"; }
          }

          return (
            <div key={p} className={`flex items-center justify-between px-2 py-1.5 rounded-sm ${bgClass}`}>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-xs font-semibold">{p}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono tabular-nums">{pred[0]}-{pred[1]}</span>
                {realResult && pts === 4 && (
                  <span className="text-[9px] text-green-400/80 font-mono leading-none"></span>
                )}
                {realResult && pts === 2 && (
                  <span className="text-[9px] text-yellow-400/80 font-mono leading-none"></span>
                )}
                {realResult && <span className={`text-[10px] font-black ${ptsColor}`}>+{pts}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
