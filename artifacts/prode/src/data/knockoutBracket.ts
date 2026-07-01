// Estructura del cuadro eliminatorio del Mundial 2026 (32 equipos, 5 rondas + tercer puesto)
// Los cruces de Dieciseisavos (R32) ya están definidos por la fase de grupos.
// Las rondas posteriores se resuelven dinámicamente según los resultados reales.

export type RoundId = "R32" | "R16" | "QF" | "SF" | "F" | "TP";

export const ROUND_LABELS: Record<RoundId, string> = {
  R32: "Dieciseisavos",
  R16: "Octavos",
  QF: "Cuartos",
  SF: "Semifinales",
  F: "Final",
  TP: "Tercer Puesto",
};

export interface MatchSource {
  matchId: string;
  take: "winner" | "loser";
}

export interface KnockoutMatchDef {
  id: string;
  round: RoundId;
  home?: string;
  away?: string;
  homeFrom?: MatchSource;
  awayFrom?: MatchSource;
  fecha: string;
  hora: string;
  sede?: string;
}

export const KNOCKOUT_MATCHES: KnockoutMatchDef[] = [
  // Dieciseisavos de Final (R32)
  { id: "M73", round: "R32", home: "Sudáfrica", away: "Canadá", fecha: "28/06", hora: "16:00", sede: "Los Ángeles" },
  { id: "M74", round: "R32", home: "Alemania", away: "Paraguay", fecha: "29/06", hora: "17:30", sede: "Boston" },
  { id: "M75", round: "R32", home: "Países Bajos", away: "Marruecos", fecha: "29/06", hora: "22:00", sede: "Monterrey" },
  { id: "M76", round: "R32", home: "Brasil", away: "Japón", fecha: "29/06", hora: "14:00", sede: "Houston" },
  { id: "M77", round: "R32", home: "Francia", away: "Suecia", fecha: "30/06", hora: "18:00", sede: "Nueva York/Nueva Jersey" },
  { id: "M78", round: "R32", home: "Costa de Marfil", away: "Noruega", fecha: "30/06", hora: "14:00", sede: "Dallas" },
  { id: "M79", round: "R32", home: "México", away: "Ecuador", fecha: "30/06", hora: "22:00", sede: "Ciudad de México" },
  { id: "M80", round: "R32", home: "Inglaterra", away: "R.D. Congo", fecha: "01/07", hora: "13:00", sede: "Atlanta" },
  { id: "M81", round: "R32", home: "EE.UU.", away: "Bosnia y Herz.", fecha: "01/07", hora: "21:00", sede: "San Francisco" },
  { id: "M82", round: "R32", home: "Bélgica", away: "Senegal", fecha: "01/07", hora: "17:00", sede: "Seattle" },
  { id: "M83", round: "R32", home: "Portugal", away: "Croacia", fecha: "02/07", hora: "20:00", sede: "Toronto" },
  { id: "M84", round: "R32", home: "España", away: "Austria", fecha: "02/07", hora: "16:00", sede: "Los Ángeles" },
  { id: "M85", round: "R32", home: "Suiza", away: "Argelia", fecha: "03/07", hora: "00:00", sede: "Vancouver" },
  { id: "M86", round: "R32", home: "Argentina", away: "Cabo Verde", fecha: "03/07", hora: "19:00", sede: "Miami" },
  { id: "M87", round: "R32", home: "Colombia", away: "Ghana", fecha: "03/07", hora: "22:30", sede: "Kansas City" },
  { id: "M88", round: "R32", home: "Australia", away: "Egipto", fecha: "03/07", hora: "15:00", sede: "Dallas" },

  // Octavos de Final (R16)
  { id: "M89", round: "R16", homeFrom: { matchId: "M74", take: "winner" }, awayFrom: { matchId: "M77", take: "winner" }, fecha: "04/07", hora: "18:00", sede: "Filadelfia" },
  { id: "M90", round: "R16", homeFrom: { matchId: "M73", take: "winner" }, awayFrom: { matchId: "M75", take: "winner" }, fecha: "04/07", hora: "14:00", sede: "Houston" },
  { id: "M91", round: "R16", homeFrom: { matchId: "M76", take: "winner" }, awayFrom: { matchId: "M78", take: "winner" }, fecha: "05/07", hora: "17:00", sede: "Nueva York/Nueva Jersey" },
  { id: "M92", round: "R16", homeFrom: { matchId: "M79", take: "winner" }, awayFrom: { matchId: "M80", take: "winner" }, fecha: "05/07", hora: "21:00", sede: "Ciudad de México" },
  { id: "M93", round: "R16", homeFrom: { matchId: "M83", take: "winner" }, awayFrom: { matchId: "M84", take: "winner" }, fecha: "06/07", hora: "16:00", sede: "Dallas" },
  { id: "M94", round: "R16", homeFrom: { matchId: "M81", take: "winner" }, awayFrom: { matchId: "M82", take: "winner" }, fecha: "06/07", hora: "21:00", sede: "Seattle" },
  { id: "M95", round: "R16", homeFrom: { matchId: "M86", take: "winner" }, awayFrom: { matchId: "M88", take: "winner" }, fecha: "07/07", hora: "13:00", sede: "Atlanta" },
  { id: "M96", round: "R16", homeFrom: { matchId: "M85", take: "winner" }, awayFrom: { matchId: "M87", take: "winner" }, fecha: "07/07", hora: "17:00", sede: "Vancouver" },

  // Cuartos de Final (QF)
  { id: "M97", round: "QF", homeFrom: { matchId: "M89", take: "winner" }, awayFrom: { matchId: "M90", take: "winner" }, fecha: "09/07", hora: "20:00", sede: "Boston" },
  { id: "M98", round: "QF", homeFrom: { matchId: "M93", take: "winner" }, awayFrom: { matchId: "M94", take: "winner" }, fecha: "10/07", hora: "16:00", sede: "Los Ángeles" },
  { id: "M99", round: "QF", homeFrom: { matchId: "M91", take: "winner" }, awayFrom: { matchId: "M92", take: "winner" }, fecha: "11/07", hora: "17:00", sede: "Miami" },
  { id: "M100", round: "QF", homeFrom: { matchId: "M95", take: "winner" }, awayFrom: { matchId: "M96", take: "winner" }, fecha: "11/07", hora: "22:00", sede: "Kansas City" },

  // Semifinales (SF)
  { id: "M101", round: "SF", homeFrom: { matchId: "M97", take: "winner" }, awayFrom: { matchId: "M98", take: "winner" }, fecha: "14/07", hora: "16:00", sede: "Dallas" },
  { id: "M102", round: "SF", homeFrom: { matchId: "M99", take: "winner" }, awayFrom: { matchId: "M100", take: "winner" }, fecha: "15/07", hora: "16:00", sede: "Atlanta" },

  // Tercer Puesto (TP)
  { id: "M103", round: "TP", homeFrom: { matchId: "M101", take: "loser" }, awayFrom: { matchId: "M102", take: "loser" }, fecha: "18/07", hora: "18:00", sede: "Miami" },

  // Final (F)
  { id: "M104", round: "F", homeFrom: { matchId: "M101", take: "winner" }, awayFrom: { matchId: "M102", take: "winner" }, fecha: "19/07", hora: "16:00", sede: "Nueva York/Nueva Jersey" },
];

export const KNOCKOUT_MATCH_BY_ID: Record<string, KnockoutMatchDef> = {};
for (const m of KNOCKOUT_MATCHES) KNOCKOUT_MATCH_BY_ID[m.id] = m;

export interface KnockoutResult {
  score: [number, number];
  penalties?: [number, number];
}

export interface ResolvedMatch {
  id: string;
  home?: string;
  away?: string;
  winner?: string;
  loser?: string;
  played: boolean;
}

export function resolveKnockoutBracket(
  results: Record<string, KnockoutResult>,
): Record<string, ResolvedMatch> {
  const resolved: Record<string, ResolvedMatch> = {};

  const resolveTeam = (m: KnockoutMatchDef, side: "home" | "away"): string | undefined => {
    if (side === "home" && m.home) return m.home;
    if (side === "away" && m.away) return m.away;
    const src = side === "home" ? m.homeFrom : m.awayFrom;
    if (!src) return undefined;
    const srcResolved = resolved[src.matchId];
    if (!srcResolved) return undefined;
    return src.take === "winner" ? srcResolved.winner : srcResolved.loser;
  };

  for (const m of KNOCKOUT_MATCHES) {
    const home = resolveTeam(m, "home");
    const away = resolveTeam(m, "away");
    const real = results[m.id];
    let winner: string | undefined;
    let loser: string | undefined;
    let played = false;

    if (real && home && away) {
      played = true;
      const [h, a] = real.score;
      if (h > a) { winner = home; loser = away; }
      else if (h < a) { winner = away; loser = home; }
      else if (real.penalties) {
        const [ph, pa] = real.penalties;
        if (ph > pa) { winner = home; loser = away; }
        else { winner = away; loser = home; }
      }
    }

    resolved[m.id] = { id: m.id, home, away, winner, loser, played };
  }

  return resolved;
}
