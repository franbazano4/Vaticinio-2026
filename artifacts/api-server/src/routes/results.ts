import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

// In-memory storage instead of PostgreSQL
let storedResults: Record<string, [number, number]> = {};

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
        score: { fullTime: { home: number | null; away: number | null } };
      }>;
    };

    let count = 0;
    for (const match of json.matches) {
      if (match.status !== "FINISHED") continue;
      const homeEs = EN_TO_ES[match.homeTeam.name] ?? match.homeTeam.name;
      const awayEs = EN_TO_ES[match.awayTeam.name] ?? match.awayTeam.name;
      const matchId = MATCH_LOOKUP[`${homeEs}|${awayEs}`];
      if (!matchId) continue;
      const h = match.score.fullTime.home;
      const a = match.score.fullTime.away;
      if (h === null || a === null) continue;
      storedResults[matchId] = [h, a];
      count++;
    }

    const message = count > 0 ? `${count} resultados actualizados` : "Sin nuevos resultados";
    res.json({ results: storedResults, count, message });
  } catch (err) {
    logger.error({ err }, "Failed to fetch results");
    res.status(500).json({ error: String(err) });
  }
});

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

export default router;