import { calcPts } from "./logic";
import { KNOCKOUT_MATCH_BY_ID, KnockoutMatchDef, ResolvedMatch, KnockoutResult } from "../data/knockoutBracket";
import { MAV_FORECASTS, OVERRIDE_FORECASTS, MatchForecast, PODIUM_FORECASTS, FORCED_MULTIPLIER_ONE } from "../data/knockoutForecasts";

function getScoreForTeam(f: MatchForecast, team: string): number | undefined {
  if (f.teamA === team) return f.scoreA;
  if (f.teamB === team) return f.scoreB;
  return undefined;
}

function forecastTeams(f: MatchForecast): Set<string> {
  return new Set([f.teamA, f.teamB]);
}

function teamsMatch(f: MatchForecast | undefined, home?: string, away?: string): boolean {
  if (!f || !home || !away) return false;
  const fset = forecastTeams(f);
  return fset.has(home) && fset.has(away) && fset.size === 2;
}

const FIXED_MULTIPLIER: Partial<Record<string, number>> = { F: 2, TP: 0.5 };

export function calcMavMultiplier(
  matchId: string,
  player: string,
  resolved: Record<string, ResolvedMatch>,
): number {
  if (FORCED_MULTIPLIER_ONE[player]?.includes(matchId)) return 1;

  const match = KNOCKOUT_MATCH_BY_ID[matchId];
  if (!match) return 1;
  if (match.round === "R32") return 1;
  if (match.round === "F" || match.round === "TP") return FIXED_MULTIPLIER[match.round]!;

  const real = resolved[matchId];
  const forecast = MAV_FORECASTS[player]?.[matchId];
  if (!real?.home || !real?.away || !teamsMatch(forecast, real.home, real.away)) return 1;

  let multiplier = 2;
  let frontier: KnockoutMatchDef[] = [match];
  while (multiplier < 4) {
    const sourceIds = frontier
      .flatMap((m) => [m.homeFrom?.matchId, m.awayFrom?.matchId])
      .filter((x): x is string => !!x);
    if (sourceIds.length === 0) break;
    const sourceMatches = sourceIds.map((id) => KNOCKOUT_MATCH_BY_ID[id]);
    if (sourceMatches.some((m) => m.round === "R32")) break;
    const allCorrect = sourceIds.every((id) => {
      const r = resolved[id];
      const f = MAV_FORECASTS[player]?.[id];
      return teamsMatch(f, r?.home, r?.away);
    });
    if (!allCorrect) break;
    multiplier++;
    frontier = sourceMatches;
  }
  return multiplier;
}

export interface MatchPointsBreakdown {
  matchId: string;
  participantsKnown: boolean;
  played: boolean;
  mavHit: boolean;
  usingForecast: "mav" | "override" | "none";
  activeForecast?: MatchForecast;
  signPts: number;
  advancePts: number;
  penaltyPts: number;
  basePts: number;
  multiplier: number;
  totalPts: number;
}

export function calcKnockoutMatchPoints(
  player: string,
  matchId: string,
  resolved: Record<string, ResolvedMatch>,
  results: Record<string, KnockoutResult>,
): MatchPointsBreakdown {
  const real = resolved[matchId];
  const base: MatchPointsBreakdown = {
    matchId,
    participantsKnown: false,
    played: false,
    mavHit: false,
    usingForecast: "none",
    signPts: 0,
    advancePts: 0,
    penaltyPts: 0,
    basePts: 0,
    multiplier: 1,
    totalPts: 0,
  };
  if (!real?.home || !real?.away) return base;
  base.participantsKnown = true;
  base.multiplier = calcMavMultiplier(matchId, player, resolved);

  const mavForecast = MAV_FORECASTS[player]?.[matchId];
  const mavHit = teamsMatch(mavForecast, real.home, real.away);
  base.mavHit = mavHit;

  let activeForecast: MatchForecast | undefined;
  if (mavHit) {
    activeForecast = mavForecast;
    base.usingForecast = "mav";
  } else {
    const override = OVERRIDE_FORECASTS[player]?.[matchId];
    if (override && teamsMatch(override, real.home, real.away)) {
      activeForecast = override;
      base.usingForecast = "override";
    }
  }
  base.activeForecast = activeForecast;

  const realResult = results[matchId];
  if (!realResult || !activeForecast) return base;
  base.played = true;

  const predHomeScore = getScoreForTeam(activeForecast, real.home);
  const predAwayScore = getScoreForTeam(activeForecast, real.away);
  if (predHomeScore === undefined || predAwayScore === undefined) return base;

  base.signPts = calcPts([predHomeScore, predAwayScore], realResult.score);

  const predIsDraw = predHomeScore === predAwayScore;

  // Art. 20 — vaticinar quién pasa: +1 para cualquiera que acierte quién avanza,
  // independientemente de si el partido se fue a penales o no.
  const predictedAdvancer = predIsDraw
    ? activeForecast.penaltyWinner
    : (predHomeScore > predAwayScore ? real.home : real.away);
  if (predictedAdvancer && real.winner && predictedAdvancer === real.winner) {
    base.advancePts = 1;
  }

  // Art. 21 — penales: aplica SOLO si el jugador arriesgó un marcador de
  // penales (penaltyScoreA/B), no por el mero hecho de nombrar quién pasa
  // (penaltyWinner, que es gratis y ya suma por Art. 20 más arriba).
  // - Si el partido se define por penales y acierta el ganador: +3.
  // - Cualquier otro caso (los penales dan otro ganador, o el partido no llega
  //   a penales porque se define en tiempo regular): -1.
  const bettedPenaltyScore = activeForecast.penaltyScoreA !== undefined && activeForecast.penaltyScoreB !== undefined;
  if (predIsDraw && bettedPenaltyScore) {
    if (realResult.penalties) {
      const realPenaltyWinner = realResult.penalties[0] > realResult.penalties[1] ? real.home : real.away;
      base.penaltyPts = activeForecast.penaltyWinner === realPenaltyWinner ? 3 : -1;
    } else {
      base.penaltyPts = -1;
    }
  }

  base.basePts = base.signPts + base.advancePts + base.penaltyPts;
  base.totalPts = base.basePts * base.multiplier;
  return base;
}

export interface PlayerKnockoutTotals {
  player: string;
  byMatch: Record<string, MatchPointsBreakdown>;
  total: number;
}

export function calcPlayerKnockoutTotal(
  player: string,
  resolved: Record<string, ResolvedMatch>,
  results: Record<string, KnockoutResult>,
): PlayerKnockoutTotals {
  const byMatch: Record<string, MatchPointsBreakdown> = {};
  let total = 0;
  for (const id of Object.keys(KNOCKOUT_MATCH_BY_ID)) {
    const b = calcKnockoutMatchPoints(player, id, resolved, results);
    byMatch[id] = b;
    total += b.totalPts;
  }
  return { player, byMatch, total };
}

export interface RondaRelampagoBreakdown {
  player: string;
  championPts: number;
  runnerUpPts: number;
  thirdPts: number;
  total: number;
  resolved: boolean;
}

export function calcRondaRelampagoPoints(
  player: string,
  resolved: Record<string, ResolvedMatch>,
): RondaRelampagoBreakdown {
  const final = resolved["M104"];
  const tercer = resolved["M103"];
  const podium = PODIUM_FORECASTS[player];
  const out: RondaRelampagoBreakdown = {
    player,
    championPts: 0,
    runnerUpPts: 0,
    thirdPts: 0,
    total: 0,
    resolved: false,
  };
  if (!final?.winner || !final?.loser || !tercer?.winner || !podium) return out;
  out.resolved = true;
  if (podium.first === final.winner) out.championPts = 1;
  if (podium.second === final.loser) out.runnerUpPts = 2;
  if (podium.third === tercer.winner) out.thirdPts = 3;
  out.total = out.championPts + out.runnerUpPts + out.thirdPts;
  return out;
}