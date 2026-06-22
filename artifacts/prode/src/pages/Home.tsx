import { useState, useMemo, useEffect, useCallback } from "react";
import { GlobeButton } from "../components/GlobeButton";
import { MatchCard } from "../components/MatchCard";
import { StandingsTable } from "../components/StandingsTable";
import { BonusTab } from "../components/BonusTab";
import { CalendarDatePicker } from "../components/CalendarDatePicker";
import { GROUP_MATCHES, GROUPS, PARTICIPANTS, FORECASTS, COLORS } from "../data/constants";
import { getGroupStandings, calcPts, calcBonusPoints } from "../lib/logic";

const API_BASE = import.meta.env.VITE_API_URL || "";

type Tab = "GRUPOS" | "POR_FECHA" | "EXTRA_GRUPOS" | "TABLA";

export default function Home() {
  const [results, setResults] = useState<Record<string, [number, number]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchResultsFromServer = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/results`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || {});
      }
    } catch (e) {
      console.error("Failed to fetch results", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResultsFromServer();
    const interval = setInterval(fetchResultsFromServer, 30000);
    return () => clearInterval(interval);
  }, [fetchResultsFromServer]);

  const [activeTab, setActiveTab] = useState<Tab>("GRUPOS");
  const [selectedGroup, setSelectedGroup] = useState<string>("A");

  const dates = useMemo(() => Array.from(new Set(GROUP_MATCHES.map(m => m.fecha))).sort(), []);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const todayStr = `${dd}/${mm}`;
    const sorted = Array.from(new Set(GROUP_MATCHES.map(m => m.fecha))).sort();
    if (sorted.includes(todayStr)) return todayStr;
    return sorted.find(d => d >= todayStr) ?? sorted[sorted.length - 1];
  });

  const groupStandings = useMemo(() => getGroupStandings(selectedGroup, results), [selectedGroup, results]);

  const tercerosStandings = useMemo(() => {
    const thirds = [];
    for (const g of Object.keys(GROUPS)) {
      const st = getGroupStandings(g, results);
      if (st.length >= 3) thirds.push(st[2]);
    }
    return thirds.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dif !== a.dif) return b.dif - a.dif;
      return b.gf - a.gf;
    });
  }, [results]);

  const isGroupStageComplete = useMemo(() => Object.keys(results).length >= 72, [results]);

  const participantLeaderboard = useMemo(() => {
    return PARTICIPANTS.map((p, i) => {
      let matchPts = 0;
      for (const m of GROUP_MATCHES) {
        const pred = FORECASTS[`${p}_${m.id}`];
        const real = results[m.id];
        if (pred && real) matchPts += calcPts(pred, real);
      }
      const bonus = calcBonusPoints(p, FORECASTS, results);
      const pts = matchPts + (isGroupStageComplete ? bonus.total : 0);
      return { name: p, matchPts, bonus: bonus.total, pts, color: COLORS[i] };
    }).sort((a, b) => b.pts - a.pts);
  }, [results, isGroupStageComplete]);

  const TABS: Tab[] = ["GRUPOS", "POR_FECHA", "EXTRA_GRUPOS", "TABLA"];
  const TAB_LABELS: Record<Tab, string> = {
    GRUPOS: "Grupos",
    POR_FECHA: "Por Fecha",
    EXTRA_GRUPOS: "Extra grupos",
    TABLA: "Tabla",
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="bg-card border-b border-border p-4 sticky top-0 z-20 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white uppercase">Vaticinio de los Pronósticos Deportivos</h1>
          <p className="text-primary text-sm font-medium tracking-wide">Copa del Mundo 2026</p>
        </div>
        <GlobeButton onFetched={fetchResultsFromServer} apiBase={API_BASE} />
      </header>

      <div className="bg-card border-b border-border sticky top-[76px] z-10">
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-bold tracking-wider uppercase transition-colors relative whitespace-nowrap ${activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}
            >
              {TAB_LABELS[tab]}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 p-4 max-w-5xl mx-auto w-full">
        {isLoading && Object.keys(results).length === 0 ? (
          <div className="text-center p-12 opacity-50 font-mono text-sm flex flex-col items-center gap-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            CARGANDO DATOS...
          </div>
        ) : (
          <div key={activeTab} className="flex flex-col gap-6 animate-fadein">

            {activeTab === "GRUPOS" && (
              <div className="space-y-6">
                {/* Selector de grupo + botón Terceros */}
                <div className="flex flex-wrap gap-2">
                  {Object.keys(GROUPS).map(g => (
                    <button
                      key={g}
                      onClick={() => setSelectedGroup(g)}
                      className={`w-10 h-10 rounded font-bold font-mono transition-all ${selectedGroup === g ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'bg-card text-muted-foreground border border-border hover:bg-white/5 hover:text-white'}`}
                    >
                      {g}
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedGroup("TERCEROS")}
                    className={`px-3 h-10 rounded font-bold font-mono transition-all text-xs ${selectedGroup === "TERCEROS" ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'bg-card text-muted-foreground border border-border hover:bg-white/5 hover:text-white'}`}
                  >
                    3°
                  </button>
                </div>

                {/* Vista de grupo */}
                {selectedGroup !== "TERCEROS" && (
                  <>
                    <div className="space-y-4">
                      <h2 className="text-lg font-bold uppercase text-white border-l-4 border-primary pl-3">Posiciones Grupo {selectedGroup}</h2>
                      <StandingsTable teams={groupStandings} />
                    </div>
                    <div className="space-y-4 pt-4">
                      <h2 className="text-lg font-bold uppercase text-white border-l-4 border-primary pl-3">Partidos</h2>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {GROUP_MATCHES.filter(m => m.group === selectedGroup).map(m => (
                          <MatchCard key={m.id} match={m} realResult={results[m.id]} allResults={results} />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Vista de terceros */}
                {selectedGroup === "TERCEROS" && (
                  <div className="space-y-6">
                    <div className="bg-primary/10 border border-primary/30 p-4 rounded-md text-sm text-primary">
                      <p className="font-bold mb-1">Clasificación de Terceros</p>
                      <p>Los 8 mejores terceros de la fase de grupos clasifican a 16avos de final.</p>
                    </div>
                    <div className="overflow-x-auto bg-card border border-border rounded-md shadow-sm">
                      <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="text-xs text-muted-foreground bg-black/40 border-b border-border font-mono uppercase">
                          <tr>
                            <th className="px-3 py-2 text-center w-8">#</th>
                            <th className="px-3 py-2">Equipo (Grupo)</th>
                            <th className="px-2 py-2 text-center">PJ</th>
                            <th className="px-2 py-2 text-center">G</th>
                            <th className="px-2 py-2 text-center hidden sm:table-cell">E</th>
                            <th className="px-2 py-2 text-center hidden sm:table-cell">P</th>
                            <th className="px-2 py-2 text-center hidden md:table-cell">GF</th>
                            <th className="px-2 py-2 text-center hidden md:table-cell">GC</th>
                            <th className="px-2 py-2 text-center">DIF</th>
                            <th className="px-3 py-2 text-center text-primary font-bold">PTS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {tercerosStandings.map((team, idx) => (
                            <tr key={team.name} className={`hover:bg-white/5 transition-colors ${idx < 8 ? 'bg-primary/5' : 'opacity-50 grayscale'}`}>
                              <td className="px-3 py-2 text-center font-mono">
                                {idx + 1}{idx < 8 && <span className="text-primary ml-1 text-[10px]">▲</span>}
                              </td>
                              <td className="px-3 py-2 font-medium">{team.name}</td>
                              <td className="px-2 py-2 text-center text-muted-foreground">{team.pj}</td>
                              <td className="px-2 py-2 text-center text-muted-foreground">{team.g}</td>
                              <td className="px-2 py-2 text-center text-muted-foreground hidden sm:table-cell">{team.e}</td>
                              <td className="px-2 py-2 text-center text-muted-foreground hidden sm:table-cell">{team.p}</td>
                              <td className="px-2 py-2 text-center text-muted-foreground hidden md:table-cell">{team.gf}</td>
                              <td className="px-2 py-2 text-center text-muted-foreground hidden md:table-cell">{team.gc}</td>
                              <td className="px-2 py-2 text-center text-muted-foreground">{team.dif > 0 ? `+${team.dif}` : team.dif}</td>
                              <td className="px-3 py-2 text-center font-bold text-white bg-black/20">{team.pts}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "POR_FECHA" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-card border border-border rounded-md p-3">
                    <p className="text-yellow-400 font-bold uppercase tracking-wider mb-1">Art. 16 · +2 pts</p>
                    <p className="text-muted-foreground">Acertar el resultado (ganador o empate) sin importar el marcador exacto.</p>
                  </div>
                  <div className="bg-card border border-border rounded-md p-3">
                    <p className="text-green-400 font-bold uppercase tracking-wider mb-1">Art. 17 · +2 pts adicionales</p>
                    <p className="text-muted-foreground">Acertar el marcador exacto. Se suma junto al Art. 16 (+4 pts en total).</p>
                  </div>
                </div>
                <CalendarDatePicker dates={dates} selected={selectedDate} onSelect={setSelectedDate} />
                <div className="space-y-4">
                  <h2 className="text-lg font-bold uppercase text-white border-l-4 border-primary pl-3">Partidos — {selectedDate}</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[...GROUP_MATCHES.filter(m => m.fecha === selectedDate)]
                      .sort((a, b) => a.hora.localeCompare(b.hora))
                      .map(m => (
                        <MatchCard key={m.id} match={m} realResult={results[m.id]} allResults={results} />
                      ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "EXTRA_GRUPOS" && <BonusTab results={results} />}

            {activeTab === "TABLA" && (
              <div className="space-y-6">
                {!isGroupStageComplete && (
                  <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-md px-4 py-3 text-sm text-yellow-300 max-w-2xl mx-auto">
                    <span className="font-bold">Fase de grupos en curso</span> — los puntos Extra grupos (Arts. 18, 19, 19bis) se sumarán al marcador cuando se jueguen los 72 partidos. Seguílos en la pestaña <span className="font-bold">Extra grupos</span>.
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
                  {participantLeaderboard.map((p, idx) => (
                    <div key={p.name} className={`bg-card border ${idx === 0 ? 'border-primary shadow-[0_0_20px_rgba(255,215,0,0.15)]' : 'border-border'} rounded-lg p-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg font-mono ${idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-black/30 text-muted-foreground'}`}>
                            {idx + 1}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="text-xl font-bold uppercase">{p.name}</span>
                            {idx === 0 && <span className="bg-primary/20 text-primary text-[10px] uppercase font-black px-2 py-0.5 rounded tracking-widest">★ LÍDER</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black tabular-nums tracking-tighter">
                            {p.pts} <span className="text-sm font-normal text-muted-foreground tracking-normal">PTS</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border/50 flex gap-4 text-xs text-muted-foreground font-mono">
                        <span>Partidos: <span className="text-white font-bold">{p.matchPts}</span></span>
                        {isGroupStageComplete
                          ? <span>Extra grupos: <span className={p.bonus > 0 ? "text-green-400 font-bold" : "text-white font-bold"}>+{p.bonus}</span></span>
                          : <span className="italic">Extra grupos: pendiente ({Object.keys(results).length}/72 partidos)</span>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
