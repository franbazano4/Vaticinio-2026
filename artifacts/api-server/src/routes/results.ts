import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

// In-memory storage instead of PostgreSQL
let storedResults: Record<string, [number, number]> = {};
let storedKnockoutResults: Record<string, { score: [number, number]; penalties?: [number, number] }> = {};

const EN_TO_ES: Record<string, string> = {
  "Mexico": "México", "South Africa": "Sudáfrica", "Korea Republic": "Corea del Sur",
  "South Korea": "Corea del Sur", "Czech Republic": "Rep. Checa", "Czechia": "Rep. Checa",
  "Canada": "Canadá", "Bosnia and Herzegovina": "Bosnia y Herz.", "Bosnia-Herzegovina": "Bosnia y Herz.",
  "Qatar": "Qatar", "Switzerland": "Suiza", "Brazil": "Brasil", "Morocco": "Marruecos",
  "Haiti": "Haití", "Scotland": "Escocia", "USA": "EE.UU.", "United States": "EE.UU.",
  "Paraguay": "Paraguay", "Australia": "Australia", "Turkey": "Turquía", "Türkiye": "Turquía",
  "Germany": "Alemania", "Curaçao": "Curaçao", "Curacao": "Curaçao",
  "Ivory Coast": "Costa de Marfil", "Côte d'Ivoire": "Costa de Marfil", "Cote d'Ivoire": "Costa de Marfil",
  "Ecuador": "Ecuador", "Netherlands": "Países Bajos", "Japan": "Japón", "Sweden": "Suecia",
  "Tunisia": "Túnez", "Belgium": "Bélgica", "Egypt": "Egipto", "Iran": "Irán",
  "New Zealand": "Nueva Zelanda", "Spain": "España", "Cape Verde Islands": "Cabo Verde",
  "Saudi Arabia": "Arabia Saudita", "Uruguay": "Uruguay", "France": "Francia",
  "Senegal": "Senegal", "Iraq": "Irak", "Norway": "Noruega", "Argentina": "Argentina",
  "Algeria": "Argelia", "Austria": "Austria", "Jordan": "Jordania", "Portugal": "Portugal",
  "DR Congo": "R.D. Congo", "Congo DR": "R.D. Congo", "Democratic Republic of Congo": "R.D. Congo",
  "Uzbekistan": "Uzbekistán", "Colombia": "Colombia", "England": "Inglaterra",
  "Croatia": "Croacia", "Ghana": "Ghana", "Panama": "Panamá", "Panamá": "Panamá",
};

const GROUP_MATCHES = [
  {id:"A1",home:"México",away:"Sudáfrica"},{id:"A2",home:"Corea del Sur",away:"Rep. Checa"},
  {id:"A3",home:"Rep. Checa",away:"Sudáfrica"},{id:"A4",home:"México",away:"Corea del Sur"},
  {id:"A5",home:"Rep. Checa",away:"México"},{id:"A6",home:"Sudáfrica",away:"Corea del Sur"},
  {id:"B1",home:"Canadá",away:"Bosnia y Herz."},{id:"B2",home:"Qatar",away:"Suiza"},
  {id:"B3",home:"Suiza",away:"Bosnia y Herz."},{id:"B4",home:"Canadá",away:"Qatar"},
  {id:"B5",home:"Suiza",away:"Canadá"},{id:"B6",home:"Bosnia y Herz.",away:"Qatar"},
  {id:"C1",home:"Brasil",away:"Marruecos"},{id:"C2",home:"Haití",away:"Escocia"},
  {id:"C3",home:"Escocia",away:"Marruecos"},{id:"C4",home:"Brasil",away:"Haití"},
  {id:"C5",home:"Escocia",away:"Brasil"},{id:"C6",home:"Marruecos",away:"Haití"},
  {id:"D1",home:"EE.UU.",away:"Paraguay"},{id:"D2",home:"Australia",away:"Turquía"},
  {id:"D3",home:"EE.UU.",away:"Australia"},{id:"D4",home:"Turquía",away:"Paraguay"},
  {id:"D5",home:"Turquía",away:"EE.UU."},{id:"D6",home:"Paraguay",away:"Australia"},
  {id:"E1",home:"Alemania",away:"Curaçao"},{id:"E2",home:"Costa de Marfil",away:"Ecuador"},
  {id:"E3",home:"Alemania",away:"Costa de Marfil"},{id:"E4",home:"Ecuador",away:"Curaçao"},
  {id:"E5",home:"Ecuador",away:"Alemania"},{id:"E6",home:"Curaçao",away:"Costa de Marfil"},
  {id:"F1",home:"Países Bajos",away:"Japón"},{id:"F2",home:"Suecia",away:"Túnez"},
  {id:"F3",home:"Países Bajos",away:"Suecia"},{id:"F4",home:"Túnez",away:"Japón"},
  {id:"F5",home:"Túnez",away:"Países Bajos"},{id:"F6",home:"Japón",away:"Suecia"},
  {id:"G1",home:"Bélgica",away:"Egipto"},{id:"G2",home:"Irán",away:"Nueva Zelanda"},
  {id:"G3",home:"Bélgica",away:"Irán"},{id:"G4",home:"Nueva Zelanda",away:"Egipto"},
  {id:"G5",home:"Nueva Zelanda",away:"Bélgica"},{id:"G6",home:"Egipto",away:"Irán"},
  {id:"H1",home:"España",away:"Cabo Verde"},{id:"H2",home:"Arabia Saudita",away:"Uruguay"},
  {id:"H3",home:"España",away:"Arabia Saudita"},{id:"H4",home:"Uruguay",away:"Cabo Verde"},
  {id:"H5",home:"Uruguay",away:"España"},{id:"H6",home:"Cabo Verde",away:"Arabia Saudita"},
  {id:"I1",home:"Francia",away:"Senegal"},{id:"I2",home:"Irak",away:"Noruega"},
  {id:"I3",home:"Francia",away:"Irak"},{id:"I4",home:"Noruega",away:"Senegal"},
  {id:"I5",home:"Noruega",away:"Francia"},{id:"I6",home:"Senegal",away:"Irak"},
  {id:"J1",home:"Argentina",away:"Argelia"},{id:"J2",home:"Austria",away:"Jordania"},
  {id:"J3",home:"Argentina",away:"Austria"},{id:"J4",home:"Jordania",away:"Argelia"},
  {id:"J5",home:"Jordania",away:"Argentina"},{id:"J6",home:"Argelia",away:"Austria"},
  {id:"K1",home:"Portugal",away:"R.D. Congo"},{id:"K2",home:"Uzbekistán",away:"Colombia"},
  {id:"K3",home:"Portugal",away:"Uzbekistán"},{id:"K4",home:"Colombia",away:"R.D. Congo"},
  {id:"K5",home:"Colombia",away:"Portugal"},{id:"K6",home:"R.D. Congo",away:"Uzbekistán"},
  {id:"L1",home:"Inglaterra",away:"Croacia"},{id:"L2",home:"Ghana",away:"Panamá"},
  {id:"L3",home:"Inglaterra",away:"Ghana"},{id:"L4",home:"Panamá",away:"Croacia"},
  {id:"L5",home:"Panamá",away:"Inglaterra"},{id:"L6",home:"Croacia",away:"Ghana"},
];

const MATCH_LOOKUP: Record<string, string> = {};
for (const m of GROUP_MATCHES) {
  MATCH_LOOKUP[`${m.home}|${m.away}`] = m.id;
}

// --- Cuadro eliminatorio (estructura fija, igual a la del frontend) ---
type MatchSource = { matchId: string; take: "winner" | "loser" };
interface KOMatchDef {
  id: string;
  home?: string;
  away?: string;
  homeFrom?: MatchSource;
  awayFrom?: MatchSource;
}

const KNOCKOUT_MATCHES: KOMatchDef[] = [
  { id: "M73", home: "Sudáfrica", away: "Canadá" },
  { id: "M74", home: "Alemania", away: "Paraguay" },
  { id: "M75", home: "Países Bajos", away: "Marruecos" },
  { id: "M76", home: "Brasil", away: "Japón" },
  { id: "M77", home: "Francia", away: "Suecia" },
  { id: "M78", home: "Costa de Marfil", away: "Noruega" },
  { id: "M79", home: "México", away: "Ecuador" },
  { id: "M80", home: "Inglaterra", away: "R.D. Congo" },
  { id: "M81", home: "EE.UU.", away: "Bosnia y Herz." },
  { id: "M82", home: "Bélgica", away: "Senegal" },
  { id: "M83", home: "Portugal", away: "Croacia" },
  { id: "M84", home: "España", away: "Austria" },
  { id: "M85", home: "Suiza", away: "Argelia" },
  { id: "M86", home: "Argentina", away: "Cabo Verde" },
  { id: "M87", home: "Colombia", away: "Ghana" },
  { id: "M88", home: "Australia", away: "Egipto" },
  { id: "M89", homeFrom: { matchId: "M74", take: "winner" }, awayFrom: { matchId: "M77", take: "winner" } },
  { id: "M90", homeFrom: { matchId: "M73", take: "winner" }, awayFrom: { matchId: "M75", take: "winner" } },
  { id: "M91", homeFrom: { matchId: "M76", take: "winner" }, awayFrom: { matchId: "M78", take: "winner" } },
  { id: "M92", homeFrom: { matchId: "M79", take: "winner" }, awayFrom: { matchId: "M80", take: "winner" } },
  { id: "M93", homeFrom: { matchId: "M83", take: "winner" }, awayFrom: { matchId: "M84", take: "winner" } },
  { id: "M94", homeFrom: { matchId: "M81", take: "winner" }, awayFrom: { matchId: "M82", take: "winner" } },
  { id: "M95", homeFrom: { matchId: "M86", take: "winner" }, awayFrom: { matchId: "M88", take: "winner" } },
  { id: "M96", homeFrom: { matchId: "M85", take: "winner" }, awayFrom: { matchId: "M87", take: "winner" } },
  { id: "M97", homeFrom: { matchId: "M89", take: "winner" }, awayFrom: { matchId: "M90", take: "winner" } },
  { id: "M98", homeFrom: { matchId: "M93", take: "winner" }, awayFrom: { matchId: "M94", take: "winner" } },
  { id: "M99", homeFrom: { matchId: "M91", take: "winner" }, awayFrom: { matchId: "M92", take: "winner" } },
  { id: "M100", homeFrom: { matchId: "M95", take: "winner" }, awayFrom: { matchId: "M96", take: "winner" } },
  { id: "M101", homeFrom: { matchId: "M97", take: "winner" }, awayFrom: { matchId: "M98", take: "winner" } },
  { id: "M102", homeFrom: { matchId: "M99", take: "winner" }, awayFrom: { matchId: "M100", take: "winner" } },
  { id: "M103", homeFrom: { matchId: "M101", take: "loser" }, awayFrom: { matchId: "M102", take: "loser" } },
  { id: "M104", homeFrom: { matchId: "M101", take: "winner" }, awayFrom: { matchId: "M102", take: "winner" } },
];

function resolveKnockoutLookup(): {
  lookup: Record<string, string>;
  teams: Record<string, { home?: string; away?: string }>;
} {
  const resolved: Record<string, { home?: string; away?: string; winner?: string; loser?: string }> = {};
  const resolveTeam = (m: KOMatchDef, side: "home" | "away"): string | undefined => {
    if (side === "home" && m.home) return m.home;
    if (side === "away" && m.away) return m.away;
    const src = side === "home" ? m.homeFrom : m.awayFrom;
    if (!src) return undefined;
    const r = resolved[src.matchId];
    if (!r) return undefined;
    return src.take === "winner" ? r.winner : r.loser;
  };

  const lookup: Record<string, string> = {};
  const teams: Record<string, { home?: string; away?: string }> = {};
  for (const m of KNOCKOUT_MATCHES) {
    const home = resolveTeam(m, "home");
    const away = resolveTeam(m, "away");
    if (home && away) {
      lookup[`${home}|${away}`] = m.id;
      lookup[`${away}|${home}`] = m.id;
      teams[m.id] = { home, away };
    }
    const real = storedKnockoutResults[m.id];
    let winner: string | undefined;
    let loser: string | undefined;
    if (real && home && away) {
      const [h, a] = real.score;
      if (h > a) { winner = home; loser = away; }
      else if (h < a) { winner = away; loser = home; }
      else if (real.penalties) {
        const [ph, pa] = real.penalties;
        if (ph > pa) { winner = home; loser = away; } else { winner = away; loser = home; }
      }
    }
    resolved[m.id] = { home, away, winner, loser };
  }
  return { lookup, teams };
}

router.get("/results", (_req, res) => {
  res.json({ results: storedResults });
});

router.post("/results", (req, res) => {
  try {
    const { results } = req.body as { results: Record<string, [number, number]> };
    storedResults = results;
    res.json({ results: storedResults });
  } catch (err) {
    res.status(500).json({ error: "Failed to save results" });
  }
});

router.get("/knockout-results", (_req, res) => {
  res.json({ results: storedKnockoutResults });
});

router.post("/knockout-results", (req, res) => {
  try {
    const { results } = req.body as { results: Record<string, { score: [number, number]; penalties?: [number, number] }> };
    storedKnockoutResults = results;
    res.json({ results: storedKnockoutResults });
  } catch (err) {
    res.status(500).json({ error: "Failed to save knockout results" });
  }
});

router.post("/results/fetch", async (req, res) => {
  try {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "FOOTBALL_DATA_API_KEY not configured" });
      return;
    }

    const response = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
      headers: { "X-Auth-Token": apiKey },
    });

    if (!response.ok) {
      const text = await response.text();
      res.status(500).json({ error: `API error ${response.status}: ${text}` });
      return;
    }

    const json = await response.json() as {
      matches: Array<{
        status: string;
        homeTeam: { name: string };
        awayTeam: { name: string };
        score: {
          fullTime: { home: number | null; away: number | null };
          extraTime?: { home: number | null; away: number | null };
          penalties?: { home: number | null; away: number | null };
        };
      }>;
    };

    let count = 0;
    let koCount = 0;

    for (const match of json.matches) {
      if (match.status !== "FINISHED") continue;
      const homeEs = EN_TO_ES[match.homeTeam.name] ?? match.homeTeam.name;
      const awayEs = EN_TO_ES[match.awayTeam.name] ?? match.awayTeam.name;
      const h = match.score.fullTime.home;
      const a = match.score.fullTime.away;
      if (h === null || a === null) continue;

      const groupMatchId = MATCH_LOOKUP[`${homeEs}|${awayEs}`];
      if (groupMatchId) {
        storedResults[groupMatchId] = [h, a];
        count++;
      }
    }

    // Resolver el cuadro eliminatorio dinámicamente (puede requerir varias pasadas
    // a medida que se van confirmando ganadores de rondas previas)
    for (let pass = 0; pass < 6; pass++) {
      const { lookup: koLookup, teams: koTeams } = resolveKnockoutLookup();
      for (const match of json.matches) {
        if (match.status !== "FINISHED") continue;
        const homeEs = EN_TO_ES[match.homeTeam.name] ?? match.homeTeam.name;
        const awayEs = EN_TO_ES[match.awayTeam.name] ?? match.awayTeam.name;
        const h = match.score.fullTime.home;
        const a = match.score.fullTime.away;
        if (h === null || a === null) continue;
        const koMatchId = koLookup[`${homeEs}|${awayEs}`];
        if (!koMatchId) continue;
        const ph = match.score.penalties?.home ?? null;
        const pa = match.score.penalties?.away ?? null;

        // football-data.org devuelve en fullTime el marcador acumulado incluyendo
        // los goles de penales (p.ej. 1+2=3, 1+3=4 → fullTime 3-4 para un 1-1 real).
        // Para obtener el resultado real (previo a penales), restamos los goles de
        // penales al fullTime. Si el resultado es negativo (o sea que fullTime NO
        // incluye penales), usamos fullTime directamente.
        let scoreH = h;
        let scoreA = a;
        if (ph !== null && pa !== null) {
          const candidateH = h - ph;
          const candidateA = a - pa;
          if (candidateH >= 0 && candidateA >= 0) {
            scoreH = candidateH;
            scoreA = candidateA;
          }
        }

        // El "home"/"away" que devuelve football-data.org para un cruce de
        // eliminatoria no tiene por qué coincidir con el home/away que le
        // asignamos nosotros en KNOCKOUT_MATCHES (ese es un orden arbitrario
        // nuestro para armar el bracket). Si vino invertido respecto de
        // nuestra convención, invertimos el resultado y los penales antes de
        // guardarlos, para que score[0]/penalties[0] siempre correspondan a
        // nuestro "home" del bracket.
        const appTeams = koTeams[koMatchId];
        const swapped = !!appTeams && appTeams.home === awayEs && appTeams.away === homeEs;

        const finalScore: [number, number] = swapped ? [scoreA, scoreH] : [scoreH, scoreA];
        let finalPenalties: [number, number] | undefined;
        if (ph !== null && pa !== null) {
          finalPenalties = swapped ? [pa, ph] : [ph, pa];
        }

        const before = storedKnockoutResults[koMatchId];
        storedKnockoutResults[koMatchId] = {
          score: finalScore,
          penalties: finalPenalties,
        };
        if (!before) koCount++;
      }
    }

    const message = `${count} resultados de grupos, ${koCount} de fase eliminatoria`;
    res.json({ results: storedResults, knockoutResults: storedKnockoutResults, count, koCount, message });
  } catch (err) {
    logger.error({ err }, "Failed to fetch results");
    res.status(500).json({ error: String(err) });
  }
});

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

export default router;
