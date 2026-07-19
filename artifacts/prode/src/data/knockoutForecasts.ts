// Vaticinio MAV de la Fase Eliminatoria — cargado entre el fin de la fase de
// grupos y el comienzo de Dieciseisavos (Art. 12 del Estatuto).
// Cada partido se guarda con los dos equipos tal como los vaticinó el jugador
// (el orden no importa: la lógica de puntaje busca por nombre de equipo, no por posición).

export interface MatchForecast {
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  // Solo se completa si el jugador vaticinó un empate en el resultado:
  // a qué equipo le da el pase por penales.
  penaltyWinner?: string;
  // Marcador vaticinado de la definición por penales (opcional).
  // penaltyScoreA corresponde a teamA, penaltyScoreB a teamB.
  penaltyScoreA?: number;
  penaltyScoreB?: number;
}

export type PlayerForecasts = Record<string, MatchForecast>;

export const MAV_FORECASTS: Record<string, PlayerForecasts> = {
  Joaco: {
    // Dieciseisavos
    M73: { teamA: "Canadá", teamB: "Sudáfrica", scoreA: 1, scoreB: 0 },
    M74: { teamA: "Alemania", teamB: "Paraguay", scoreA: 1, scoreB: 0 },
    M75: { teamA: "Marruecos", teamB: "Países Bajos", scoreA: 2, scoreB: 1 },
    M76: { teamA: "Brasil", teamB: "Japón", scoreA: 2, scoreB: 1 },
    M77: { teamA: "Francia", teamB: "Suecia", scoreA: 2, scoreB: 0 },
    M78: { teamA: "Costa de Marfil", teamB: "Noruega", scoreA: 1, scoreB: 2 },
    M79: { teamA: "México", teamB: "Ecuador", scoreA: 0, scoreB: 1 },
    M80: { teamA: "Inglaterra", teamB: "R.D. Congo", scoreA: 1, scoreB: 0 },
    M81: { teamA: "EE.UU.", teamB: "Bosnia y Herz.", scoreA: 2, scoreB: 0 },
    M82: { teamA: "Bélgica", teamB: "Senegal", scoreA: 1, scoreB: 2 },
    M83: { teamA: "Portugal", teamB: "Croacia", scoreA: 1, scoreB: 0 },
    M84: { teamA: "España", teamB: "Austria", scoreA: 2, scoreB: 0 },
    M85: { teamA: "Suiza", teamB: "Argelia", scoreA: 3, scoreB: 1 },
    M86: { teamA: "Argentina", teamB: "Cabo Verde", scoreA: 2, scoreB: 0 },
    M87: { teamA: "Colombia", teamB: "Ghana", scoreA: 2, scoreB: 1 },
    M88: { teamA: "Australia", teamB: "Egipto", scoreA: 1, scoreB: 1, penaltyWinner: "Egipto" },
    // Octavos
    M89: { teamA: "Alemania", teamB: "Francia", scoreA: 1, scoreB: 1, penaltyWinner: "Francia" },
    M90: { teamA: "Canadá", teamB: "Marruecos", scoreA: 0, scoreB: 1 },
    M91: { teamA: "Brasil", teamB: "Noruega", scoreA: 0, scoreB: 1 },
    M92: { teamA: "Ecuador", teamB: "Inglaterra", scoreA: 0, scoreB: 2 },
    M93: { teamA: "Portugal", teamB: "España", scoreA: 1, scoreB: 2 },
    M94: { teamA: "EE.UU.", teamB: "Senegal", scoreA: 1, scoreB: 1, penaltyWinner: "EE.UU." },
    M95: { teamA: "Argentina", teamB: "Egipto", scoreA: 2, scoreB: 1 },
    M96: { teamA: "Suiza", teamB: "Colombia", scoreA: 1, scoreB: 1, penaltyWinner: "Suiza" },
    // Cuartos
    M97: { teamA: "Francia", teamB: "Marruecos", scoreA: 2, scoreB: 1 },
    M98: { teamA: "España", teamB: "EE.UU.", scoreA: 2, scoreB: 0 },
    M99: { teamA: "Noruega", teamB: "Inglaterra", scoreA: 0, scoreB: 1 },
    M100: { teamA: "Argentina", teamB: "Suiza", scoreA: 1, scoreB: 0 },
    // Semis
    M101: { teamA: "Francia", teamB: "España", scoreA: 2, scoreB: 1 },
    M102: { teamA: "Argentina", teamB: "Inglaterra", scoreA: 2, scoreB: 0 },
    // Tercer puesto
    M103: { teamA: "España", teamB: "Inglaterra", scoreA: 1, scoreB: 2 },
    // Final
    M104: { teamA: "Argentina", teamB: "Francia", scoreA: 1, scoreB: 1, penaltyWinner: "Argentina", penaltyScoreA: 4, penaltyScoreB: 3 },
  },

  Mati: {
    M73: { teamA: "Sudáfrica", teamB: "Canadá", scoreA: 1, scoreB: 2 },
    M74: { teamA: "Alemania", teamB: "Paraguay", scoreA: 3, scoreB: 1 },
    M75: { teamA: "Países Bajos", teamB: "Marruecos", scoreA: 2, scoreB: 1 },
    M76: { teamA: "Brasil", teamB: "Japón", scoreA: 1, scoreB: 1, penaltyWinner: "Brasil", penaltyScoreA: 5, penaltyScoreB: 4 },
    M77: { teamA: "Francia", teamB: "Suecia", scoreA: 3, scoreB: 0 },
    M78: { teamA: "Costa de Marfil", teamB: "Noruega", scoreA: 1, scoreB: 2 },
    M79: { teamA: "México", teamB: "Ecuador", scoreA: 1, scoreB: 0 },
    M80: { teamA: "Inglaterra", teamB: "R.D. Congo", scoreA: 2, scoreB: 1 },
    M81: { teamA: "EE.UU.", teamB: "Bosnia y Herz.", scoreA: 2, scoreB: 0 },
    M82: { teamA: "Bélgica", teamB: "Senegal", scoreA: 1, scoreB: 2 },
    M83: { teamA: "Portugal", teamB: "Croacia", scoreA: 1, scoreB: 1, penaltyWinner: "Croacia", penaltyScoreA: 2, penaltyScoreB: 4 },
    M84: { teamA: "España", teamB: "Austria", scoreA: 2, scoreB: 1 },
    M85: { teamA: "Suiza", teamB: "Argelia", scoreA: 1, scoreB: 0 },
    M86: { teamA: "Argentina", teamB: "Cabo Verde", scoreA: 3, scoreB: 0 },
    M87: { teamA: "Colombia", teamB: "Ghana", scoreA: 2, scoreB: 1 },
    M88: { teamA: "Australia", teamB: "Egipto", scoreA: 1, scoreB: 2 },
    M89: { teamA: "Alemania", teamB: "Francia", scoreA: 1, scoreB: 2 },
    M90: { teamA: "Países Bajos", teamB: "Canadá", scoreA: 3, scoreB: 1 },
    M91: { teamA: "Brasil", teamB: "Noruega", scoreA: 1, scoreB: 2 },
    M92: { teamA: "México", teamB: "Inglaterra", scoreA: 1, scoreB: 3 },
    M93: { teamA: "Croacia", teamB: "España", scoreA: 0, scoreB: 2 },
    M94: { teamA: "EE.UU.", teamB: "Senegal", scoreA: 2, scoreB: 1 },
    M95: { teamA: "Argentina", teamB: "Egipto", scoreA: 3, scoreB: 1 },
    M96: { teamA: "Suiza", teamB: "Colombia", scoreA: 1, scoreB: 2 },
    M97: { teamA: "Francia", teamB: "Países Bajos", scoreA: 2, scoreB: 1 },
    M98: { teamA: "España", teamB: "EE.UU.", scoreA: 1, scoreB: 0 },
    M99: { teamA: "Noruega", teamB: "Inglaterra", scoreA: 1, scoreB: 1, penaltyWinner: "Inglaterra" },
    M100: { teamA: "Argentina", teamB: "Colombia", scoreA: 2, scoreB: 1 },
    M101: { teamA: "Francia", teamB: "España", scoreA: 6, scoreB: 6, penaltyWinner: "España", penaltyScoreA: 13, penaltyScoreB: 14 },
    M102: { teamA: "Argentina", teamB: "Inglaterra", scoreA: 8, scoreB: 8, penaltyWinner: "Inglaterra", penaltyScoreA: 22, penaltyScoreB: 23 },
    M103: { teamA: "España", teamB: "Inglaterra", scoreA: 2, scoreB: 0 },
    M104: { teamA: "Francia", teamB: "Argentina", scoreA: 1, scoreB: 2 },
  },

  Cochi: {
    M73: { teamA: "Sudáfrica", teamB: "Canadá", scoreA: 0, scoreB: 0, penaltyWinner: "Sudáfrica", penaltyScoreA: 5, penaltyScoreB: 4 },
    M74: { teamA: "Alemania", teamB: "Paraguay", scoreA: 1, scoreB: 0 },
    M75: { teamA: "Países Bajos", teamB: "Marruecos", scoreA: 2, scoreB: 1 },
    M76: { teamA: "Brasil", teamB: "Japón", scoreA: 2, scoreB: 1 },
    M77: { teamA: "Francia", teamB: "Suecia", scoreA: 3, scoreB: 0 },
    M78: { teamA: "Costa de Marfil", teamB: "Noruega", scoreA: 1, scoreB: 3 },
    M79: { teamA: "México", teamB: "Ecuador", scoreA: 1, scoreB: 1, penaltyWinner: "Ecuador", penaltyScoreA: 2, penaltyScoreB: 4 },
    M80: { teamA: "Inglaterra", teamB: "R.D. Congo", scoreA: 2, scoreB: 0 },
    M81: { teamA: "EE.UU.", teamB: "Bosnia y Herz.", scoreA: 3, scoreB: 1 },
    M82: { teamA: "Bélgica", teamB: "Senegal", scoreA: 1, scoreB: 0 },
    M83: { teamA: "Portugal", teamB: "Croacia", scoreA: 2, scoreB: 2, penaltyWinner: "Portugal", penaltyScoreA: 7, penaltyScoreB: 6 },
    M84: { teamA: "España", teamB: "Austria", scoreA: 2, scoreB: 0 },
    M85: { teamA: "Suiza", teamB: "Argelia", scoreA: 3, scoreB: 2 },
    M86: { teamA: "Argentina", teamB: "Cabo Verde", scoreA: 2, scoreB: 0 },
    M87: { teamA: "Colombia", teamB: "Ghana", scoreA: 1, scoreB: 0 },
    M88: { teamA: "Australia", teamB: "Egipto", scoreA: 1, scoreB: 2 },
    M89: { teamA: "Alemania", teamB: "Francia", scoreA: 1, scoreB: 2 },
    M90: { teamA: "Sudáfrica", teamB: "Países Bajos", scoreA: 0, scoreB: 3 },
    M91: { teamA: "Brasil", teamB: "Noruega", scoreA: 2, scoreB: 1 },
    M92: { teamA: "Ecuador", teamB: "Inglaterra", scoreA: 1, scoreB: 1, penaltyWinner: "Inglaterra", penaltyScoreA: 2, penaltyScoreB: 4 },
    M93: { teamA: "Portugal", teamB: "España", scoreA: 1, scoreB: 2 },
    M94: { teamA: "EE.UU.", teamB: "Bélgica", scoreA: 2, scoreB: 1 },
    M95: { teamA: "Argentina", teamB: "Egipto", scoreA: 2, scoreB: 1 },
    M96: { teamA: "Suiza", teamB: "Colombia", scoreA: 0, scoreB: 1 },
    M97: { teamA: "Francia", teamB: "Países Bajos", scoreA: 3, scoreB: 1 },
    M98: { teamA: "España", teamB: "EE.UU.", scoreA: 1, scoreB: 1, penaltyWinner: "EE.UU.", penaltyScoreA: 4, penaltyScoreB: 5 },
    M99: { teamA: "Brasil", teamB: "Inglaterra", scoreA: 2, scoreB: 1 },
    M100: { teamA: "Argentina", teamB: "Colombia", scoreA: 1, scoreB: 1, penaltyWinner: "Argentina", penaltyScoreA: 4, penaltyScoreB: 2 },
    M101: { teamA: "Francia", teamB: "EE.UU.", scoreA: 2, scoreB: 0 },
    M102: { teamA: "Brasil", teamB: "Argentina", scoreA: 0, scoreB: 1 },
    M103: { teamA: "EE.UU.", teamB: "Brasil", scoreA: 0, scoreB: 2 },
    M104: { teamA: "Francia", teamB: "Argentina", scoreA: 2, scoreB: 0 },
  },

  Fran: {
    M73: { teamA: "Sudáfrica", teamB: "Canadá", scoreA: 0, scoreB: 1 },
    M74: { teamA: "Alemania", teamB: "Paraguay", scoreA: 3, scoreB: 1 },
    M75: { teamA: "Países Bajos", teamB: "Marruecos", scoreA: 1, scoreB: 1, penaltyWinner: "Marruecos" },
    M76: { teamA: "Brasil", teamB: "Japón", scoreA: 2, scoreB: 0},
    M77: { teamA: "Francia", teamB: "Suecia", scoreA: 2, scoreB: 0 },
    M78: { teamA: "Costa de Marfil", teamB: "Noruega", scoreA: 0, scoreB: 3 },
    M79: { teamA: "México", teamB: "Ecuador", scoreA: 1, scoreB: 1, penaltyWinner: "México" },
    M80: { teamA: "Inglaterra", teamB: "R.D. Congo", scoreA: 3, scoreB: 0 },
    M81: { teamA: "EE.UU.", teamB: "Bosnia y Herz.", scoreA: 3, scoreB: 1 },
    M82: { teamA: "Bélgica", teamB: "Senegal", scoreA: 0, scoreB: 0, penaltyWinner: "Bélgica" },
    M83: { teamA: "Portugal", teamB: "Croacia", scoreA: 2, scoreB: 1 },
    M84: { teamA: "España", teamB: "Austria", scoreA: 2, scoreB: 0 },
    M85: { teamA: "Suiza", teamB: "Argelia", scoreA: 1, scoreB: 0 },
    M86: { teamA: "Argentina", teamB: "Cabo Verde", scoreA: 4, scoreB: 1 },
    M87: { teamA: "Colombia", teamB: "Ghana", scoreA: 2, scoreB: 0 },
    M88: { teamA: "Australia", teamB: "Egipto", scoreA: 1, scoreB: 1, penaltyWinner: "Egipto" },
    M89: { teamA: "Alemania", teamB: "Francia", scoreA: 1, scoreB: 2 },
    M90: { teamA: "Canadá", teamB: "Marruecos", scoreA: 0, scoreB: 3 },
    M91: { teamA: "Brasil", teamB: "Noruega", scoreA: 2, scoreB: 0 },
    M92: { teamA: "México", teamB: "Inglaterra", scoreA: 1, scoreB: 3 },
    M93: { teamA: "Portugal", teamB: "España", scoreA: 0, scoreB: 1 },
    M94: { teamA: "EE.UU.", teamB: "Bélgica", scoreA: 1, scoreB: 0 },
    M95: { teamA: "Argentina", teamB: "Egipto", scoreA: 2, scoreB: 0 },
    M96: { teamA: "Suiza", teamB: "Colombia", scoreA: 0, scoreB: 1 },
    M97: { teamA: "Francia", teamB: "Marruecos", scoreA: 2, scoreB: 0 },
    M98: { teamA: "España", teamB: "EE.UU.", scoreA: 2, scoreB: 0 },
    M99: { teamA: "Brasil", teamB: "Inglaterra", scoreA: 1, scoreB: 1, penaltyWinner: "Inglaterra" },
    M100: { teamA: "Argentina", teamB: "Colombia", scoreA: 2, scoreB: 1 },
    M101: { teamA: "Francia", teamB: "España", scoreA: 1, scoreB: 1, penaltyWinner: "Francia" },
    M102: { teamA: "Inglaterra", teamB: "Argentina", scoreA: 1, scoreB: 2 },
    M103: { teamA: "España", teamB: "Inglaterra", scoreA: 2, scoreB: 0 },
    M104: { teamA: "Francia", teamB: "Argentina", scoreA: 1, scoreB: 0 },
  },
};

// Vaticinio del podio (Ronda Relámpago, Art. 23/24bis/24tris) — se deduce
// directamente de la Final y el Tercer Puesto vaticinados por cada jugador,
// pero queda explícito acá para referencia y para el cálculo de puntos.
export interface PodiumForecast {
  first: string;
  second: string;
  third: string;
}

export const PODIUM_FORECASTS: Record<string, PodiumForecast> = {
  Joaco: { first: "Argentina", second: "Francia", third: "Inglaterra" },
  Mati: { first: "Argentina", second: "Francia", third: "España" },
  Cochi: { first: "Francia", second: "Argentina", third: "Brasil" },
  Fran: { first: "Francia", second: "Argentina", third: "España" },
};

// Pronósticos "post-MAV": si un jugador erró los participantes de un partido
// en su vaticinio MAV, una vez confirmado el cruce real puede cargar un nuevo
// pronóstico de resultado sobre el partido que efectivamente se juega
// (Art. 22 — el pronóstico original sobre un cruce que no ocurrió no es válido).
// Se va completando a medida que avanza el torneo.
export const OVERRIDE_FORECASTS: Record<string, Record<string, MatchForecast>> = {
  Joaco: {
    M89: { teamA: "Paraguay", teamB: "Francia", scoreA: 0, scoreB: 2 },
    M92: { teamA: "México", teamB: "Inglaterra", scoreA: 0, scoreB: 1 },
    M94: { teamA: "EE.UU.", teamB: "Bélgica", scoreA: 2, scoreB: 1 },
    M98: { teamA: "España", teamB: "Bélgica", scoreA: 2, scoreB: 0 },
    M103: { teamA: "España", teamB: "Argentina", scoreA: 1, scoreB: 3 },
    M104: { teamA: "Inglaterra", teamB: "Francia", scoreA: 1, scoreB: 2 },
  },
  Mati: {
    M89: { teamA: "Paraguay", teamB: "Francia", scoreA: 0, scoreB: 2 },
    M90: { teamA: "Canadá", teamB: "Marruecos", scoreA: 1, scoreB: 3 },
    M93: { teamA: "Portugal", teamB: "España", scoreA: 1, scoreB: 1, penaltyWinner: "Portugal", penaltyScoreA: 4, penaltyScoreB: 2 },
    M94: { teamA: "EE.UU.", teamB: "Bélgica", scoreA: 2, scoreB: 1 },
    M97: { teamA: "Francia", teamB: "Marruecos", scoreA: 2, scoreB: 2, penaltyWinner: "Marruecos", penaltyScoreA: 3, penaltyScoreB: 5 },
    M98: { teamA: "España", teamB: "Bélgica", scoreA: 1, scoreB: 0 },
    M100: { teamA: "Argentina", teamB: "Suiza", scoreA: 2, scoreB: 1 },
    M103: { teamA: "España", teamB: "Argentina", scoreA: 4, scoreB: 4, penaltyWinner: "Argentina" },
    M104: { teamA: "Inglaterra", teamB: "Francia", scoreA: 8, scoreB: 8, penaltyWinner: "Inglaterra", penaltyScoreA: 15, penaltyScoreB: 14 },
  },
  Cochi: {
    M89: { teamA: "Paraguay", teamB: "Francia", scoreA: 0, scoreB: 3 },
    M90: { teamA: "Canadá", teamB: "Marruecos", scoreA: 0, scoreB: 3 },
    M92: { teamA: "México", teamB: "Inglaterra", scoreA: 1, scoreB: 1, penaltyWinner: "Inglaterra", penaltyScoreA: 2, penaltyScoreB: 4 },
    M97: { teamA: "Francia", teamB: "Marruecos", scoreA: 3, scoreB: 1 },
    M98: { teamA: "España", teamB: "Bélgica", scoreA: 2, scoreB: 1 },
    M99: { teamA: "Noruega", teamB: "Inglaterra", scoreA: 2, scoreB: 1 },
    M100: { teamA: "Argentina", teamB: "Suiza", scoreA: 3, scoreB: 2 },
    M101: { teamA: "Francia", teamB: "España", scoreA: 2, scoreB: 1 },
    M102: { teamA: "Argentina", teamB: "Inglaterra", scoreA: 3, scoreB: 2 },
    M103: { teamA: "Argentina", teamB: "España", scoreA: 5, scoreB: 4 },
    M104: { teamA: "Inglaterra", teamB: "Francia", scoreA: 1, scoreB: 0 },
  },
  Fran: {
    M89: { teamA: "Francia", teamB: "Paraguay", scoreA: 3, scoreB: 1 },
    M98: { teamA: "España", teamB: "Bélgica", scoreA: 2, scoreB: 0 },
    M99: { teamA: "Noruega", teamB: "Inglaterra", scoreA: 1, scoreB: 0 },
    M100: { teamA: "Argentina", teamB: "Suiza", scoreA: 3, scoreB: 1 },
    M103: { teamA: "España", teamB: "Argentina", scoreA: 2, scoreB: 1 },
    M104: { teamA: "Inglaterra", teamB: "Francia", scoreA: 0, scoreB: 2 },
  },
};

// Partidos donde el jugador cambió voluntariamente su pronóstico MAV
// (los equipos ya eran correctos, no hubo "cruce roto"). Como castigo por
// el cambio, pierde el multiplicador de esa fase y queda fijo en x1,
// aunque el resto de la cadena de aciertos hubiera sido correcta.
export const FORCED_MULTIPLIER_ONE: Record<string, string[]> = {
  Fran: ["M101"],
  Mati: ["M101", "M102"],
};