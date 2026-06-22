import { useState, useMemo, useEffect, useCallback } from "react";
import { GlobeButton } from "../components/GlobeButton";
import { MatchCard } from "../components/MatchCard";
import { StandingsTable } from "../components/StandingsTable";
import { BonusTab } from "../components/BonusTab";
import { CalendarDatePicker } from "../components/CalendarDatePicker";
import { GROUP_MATCHES, GROUPS, PARTICIPANTS, FORECASTS, COLORS } from "../data/constants";
import { getGroupStandings, calcPts, calcBonusPoints } from "../lib/logic";

const API_BASE = import.meta.env.VITE_API_URL || "";

type Tab = "PRINCIPAL" | "GRUPOS" | "EXTRA_GRUPOS" | "REGLAS";

export default function Home() {
  const [results, setResults] = useState<Record<string, [number, number]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("PRINCIPAL");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>("A");

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

  const groupStandings = useMemo(() => {
    if (selectedGroup === "TERCEROS") return [];
    return getGroupStandings(selectedGroup, results);
  }, [selectedGroup, results]);

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

  const TAB_LABELS: Record<Tab, string> = {
    PRINCIPAL: "Principal",
    GRUPOS: "Grupos",
    EXTRA_GRUPOS: "Extra grupos",
    REGLAS: "Reglas",
  };

  const navigateTo = (tab: Tab) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="bg-card border-b border-border p-4 sticky top-0 z-20 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white uppercase">Vaticinio de los Pronósticos Deportivos</h1>
          <p className="text-primary text-sm font-medium tracking-wide">Copa del Mundo 2026</p>
        </div>
        <div className="flex items-center gap-3">
          <GlobeButton onFetched={fetchResultsFromServer} apiBase={API_BASE} />
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex flex-col justify-center items-center gap-1.5 w-10 h-10 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Menú"
          >
            <span className={`block w-5 h-0.5 bg-white transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute top-[73px] right-4 bg-card border border-border rounded-lg shadow-2xl overflow-hidden w-52"
            onClick={e => e.stopPropagation()}
          >
            {(["PRINCIPAL", "GRUPOS", "EXTRA_GRUPOS", "REGLAS"] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => navigateTo(tab)}
                className={`w-full text-left px-5 py-3.5 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-between ${
                  activeTab === tab
                    ? "text-primary bg-primary/10 border-l-2 border-primary"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                {TAB_LABELS[tab]}
                {activeTab === tab && <span className="text-primary text-xs">●</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1 p-4 max-w-5xl mx-auto w-full">
        {isLoading && Object.keys(results).length === 0 ? (
          <div className="text-center p-12 opacity-50 font-mono text-sm flex flex-col items-center gap-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            CARGANDO DATOS...
          </div>
        ) : (
          <div key={activeTab} className="flex flex-col gap-6">

            {activeTab === "PRINCIPAL" && (
              <div className="space-y-6">
                {/* Tabla de ranking compacta */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="bg-black/30 px-4 py-2 border-b border-border">
                    <p className="text-primary font-bold uppercase tracking-wider text-sm">Tabla de posiciones</p>
                  </div>
                  <div className="divide-y divide-border/50">
                    {participantLeaderboard.map((p, idx) => (
                      <div key={p.name} className={`flex items-center gap-3 px-4 py-2.5 ${idx === 0 ? "bg-primary/5" : ""}`}>
                        <span className={`w-6 text-center font-black font-mono text-sm ${idx === 0 ? "text-primary" : "text-muted-foreground"}`}>{idx + 1}</span>
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                        <span className={`flex-1 font-bold uppercase text-sm ${idx === 0 ? "text-white" : "text-muted-foreground"}`}>{p.name}</span>
                        {idx === 0 && <span className="text-primary text-[10px] font-black">★ LÍDER</span>}
                        <span className={`font-black text-lg tabular-nums ${idx === 0 ? "text-primary" : "text-white"}`}>{p.pts}</span>
                        <span className="text-muted-foreground text-xs">pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calendario desplegable + partidos */}
                <CalendarDatePicker dates={dates} selected={selectedDate} onSelect={setSelectedDate} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[...GROUP_MATCHES.filter(m => m.fecha === selectedDate)]
                    .sort((a, b) => a.hora.localeCompare(b.hora))
                    .map(m => (
                      <MatchCard key={m.id} match={m} realResult={results[m.id]} allResults={results} />
                    ))}
                </div>
              </div>
            )}

            {activeTab === "GRUPOS" && (
              <div className="space-y-6">
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
                          {tercerosStandings.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="px-3 py-6 text-center text-muted-foreground text-sm italic">
                                Sin resultados cargados aún
                              </td>
                            </tr>
                          ) : tercerosStandings.map((team, idx) => (
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

            {activeTab === "EXTRA_GRUPOS" && <BonusTab results={results} />}

            {activeTab === "REGLAS" && (
              <div className="space-y-4 max-w-2xl mx-auto">
                <h2 className="text-lg font-bold uppercase text-white border-l-4 border-primary pl-3">Reglas de puntuación</h2>
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="bg-black/30 px-4 py-2 border-b border-border">
                    <p className="text-primary font-bold uppercase tracking-wider text-sm">Resultados de partidos</p>
                  </div>
                  <div className="divide-y divide-border/50">
                    <div className="px-4 py-3 flex items-start gap-4">
                      <span className="text-yellow-400 font-black text-lg w-10 text-center flex-shrink-0">+2</span>
                      <div>
                        <p className="text-white font-bold text-sm">Art. 16 — Resultado no exacto</p>
                        <p className="text-muted-foreground text-xs mt-0.5">Acertar el ganador o empate sin importar el marcador exacto.</p>
                      </div>
                    </div>
                    <div className="px-4 py-3 flex items-start gap-4">
                      <span className="text-green-400 font-black text-lg w-10 text-center flex-shrink-0">+4</span>
                      <div>
                        <p className="text-white font-bold text-sm">Art. 17 — Resultado exacto</p>
                        <p className="text-muted-foreground text-xs mt-0.5">Acertar el marcador exacto. Suma los +2 del Art. 16 más +2 adicionales.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="bg-black/30 px-4 py-2 border-b border-border">
                    <p className="text-primary font-bold uppercase tracking-wider text-sm">Extra grupos — Solo al finalizar la fase</p>
                  </div>
                  <div className="divide-y divide-border/50">
                    <div className="px-4 py-3 flex items-start gap-4">
                      <span className="text-yellow-400 font-black text-lg w-10 text-center flex-shrink-0">+1</span>
                      <div>
                        <p className="text-white font-bold text-sm">Art. 18 — Posición exacta</p>
                        <p className="text-muted-foreground text-xs mt-0.5">+1 punto por cada equipo en la posición correcta (1°, 2°, 3° o 4°) dentro de un grupo.</p>
                      </div>
                    </div>
                    <div className="px-4 py-3 flex items-start gap-4">
                      <span className="text-yellow-400 font-black text-lg w-10 text-center flex-shrink-0">+2/5</span>
                      <div>
                        <p className="text-white font-bold text-sm">Art. 19 — Clasificados</p>
                        <p className="text-muted-foreground text-xs mt-0.5">+2 pts si acertás 1 de los 2 clasificados de un grupo. +5 pts si acertás ambos. Solo aplica para 1° y 2° de cada grupo.</p>
                      </div>
                    </div>
                    <div className="px-4 py-3 flex items-start gap-4">
                      <span className="text-yellow-400 font-black text-lg w-10 text-center flex-shrink-0">1→5</span>
                      <div>
                        <p className="text-white font-bold text-sm">Art. 19bis — Mejores terceros</p>
                        <p className="text-muted-foreground text-xs mt-0.5">Los 8 mejores terceros clasifican. Los puntos dependen de la posición en la tabla de terceros:</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {["1°→+1","2°→+2","3°→+2","4°→+3","5°→+3","6°→+4","7°→+4","8°→+5"].map(r => (
                            <span key={r} className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded border border-primary/20">{r}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
