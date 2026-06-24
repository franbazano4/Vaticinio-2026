import { GROUP_MATCHES, GROUPS } from "../data/constants";

export function calcPts(
  pred: [number, number],
  real: [number, number],
): number {
  const [ph, pa] = pred,
    [rh, ra] = real;
  if (ph === rh && pa === ra) return 4;
  const ps = ph > pa ? 1 : ph < pa ? -1 : 0;
  const rs = rh > ra ? 1 : rh < ra ? -1 : 0;
  if (ps === rs) return 2;
  return 0;
}

export interface TeamStats {
  name: string;
  pj: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dif: number;
  pts: number;
}

export function getGroupStandings(
  group: string,
  results: Record<string, [number, number]>,
): TeamStats[] {
  const teams = GROUPS[group];
  const statsMap: Record<string, TeamStats> = {};
  for (const team of teams) {
    statsMap[team] = {
      name: team,
      pj: 0,
      g: 0,
      e: 0,
      p: 0,
      gf: 0,
      gc: 0,
      dif: 0,
      pts: 0,
    };
  }
  const matches = GROUP_MATCHES.filter((m) => m.group === group);
  for (const match of matches) {
    const result = results[match.id];
    if (result) {
      const [h, a] = result;
      const hStats = statsMap[match.home];
      const aStats = statsMap[match.away];
      hStats.pj++;
      aStats.pj++;
      hStats.gf += h;
      hStats.gc += a;
      aStats.gf += a;
      aStats.gc += h;
      hStats.dif = hStats.gf - hStats.gc;
      aStats.dif = aStats.gf - aStats.gc;
      if (h > a) {
        hStats.g++;
        aStats.p++;
        hStats.pts += 3;
      } else if (h < a) {
        aStats.g++;
        hStats.p++;
        aStats.pts += 3;
      } else {
        hStats.e++;
        aStats.e++;
        hStats.pts += 1;
        aStats.pts += 1;
      }
    }
  }
  return Object.values(statsMap).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dif !== a.dif) return b.dif - a.dif;
    return b.gf - a.gf;
  });
}

export function getPlayerGroupStandings(
  player: string,
  group: string,
  forecasts: Record<string, [number, number]>,
): TeamStats[] {
  const playerResults: Record<string, [number, number]> = {};
  GROUP_MATCHES.filter((m) => m.group === group).forEach((m) => {
    const pred = forecasts[`${player}_${m.id}`];
    if (pred) playerResults[m.id] = pred;
  });
  return getGroupStandings(group, playerResults);
}

export function getActualBestThirds(
  results: Record<string, [number, number]>,
): string[] {
  const thirds: TeamStats[] = [];
  for (const g of Object.keys(GROUPS)) {
    const st = getGroupStandings(g, results);
    if (st.length >= 3) thirds.push(st[2]);
  }
  return thirds
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dif !== a.dif) return b.dif - a.dif;
      return b.gf - a.gf;
    })
    .slice(0, 8)
    .map((t) => t.name);
}

export interface BonusBreakdown {
  art18: number;
  art19: number;
  art19bis: number;
  total: number;
}

const ART19_SCALE = [
  2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
];
const ART19BIS_SCALE = [1, 2, 2, 3, 3, 4, 4, 5];

export function calcBonusPoints(
  player: string,
  forecasts: Record<string, [number, number]>,
  results: Record<string, [number, number]>,
): BonusBreakdown {
  const groupKeys = Object.keys(GROUPS);

  // Art. 18 — exact position match (+1 per correct position)
  let art18 = 0;
  for (const g of groupKeys) {
    const actual = getGroupStandings(g, results);
    const predicted = getPlayerGroupStandings(player, g, forecasts);
    for (let pos = 0; pos < 4; pos++) {
      if (actual[pos] && predicted[pos] && actual[pos].name === predicted[pos].name) {
        art18++;
      }
    }
  }

  // Art. 19 — per group: +2 first qualifier correct, +3 each extra
  // Build a map: group -> Set of teams that actually qualified from that group
  // (always the top 2, plus the 3rd if they are among the best 8 thirds)
  const bestThirdsSet = new Set(getActualBestThirds(results));
  const qualifiersByGroup: Record<string, Set<string>> = {};
  for (const g of groupKeys) {
    const standing = getGroupStandings(g, results);
    const qualifiers = new Set<string>();
    if (standing[0]) qualifiers.add(standing[0].name);
    if (standing[1]) qualifiers.add(standing[1].name);
    if (standing[2] && bestThirdsSet.has(standing[2].name)) {
      qualifiers.add(standing[2].name);
    }
    qualifiersByGroup[g] = qualifiers;
  }

  let art19 = 0;
  for (const g of groupKeys) {
    const groupQualifiers = qualifiersByGroup[g];
    // Skip groups with no results yet
    if (groupQualifiers.size === 0) continue;
    const predicted = getPlayerGroupStandings(player, g, forecasts);
    // Build the player's predicted qualifiers set: top N teams from their prediction
    // where N = how many teams actually qualify from this group (2 or 3)
    const n = groupQualifiers.size;
    const predictedQualifiers = new Set(
      predicted.slice(0, n).map(t => t.name)
    );
    // Count how many predicted qualifiers are in the real qualifiers set
    let hits = 0;
    predictedQualifiers.forEach(name => {
      if (groupQualifiers.has(name)) hits++;
    });
    art19 += hits === 0 ? 0 : hits === 1 ? 2 : 2 + (hits - 1) * 3;
  }

  // Art. 19bis — best 8 thirds, points based on real position
  const allThirdsStats: TeamStats[] = [];
  for (const g of groupKeys) {
    const st = getGroupStandings(g, results);
    if (st[2]) allThirdsStats.push(st[2]);
  }
  allThirdsStats.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dif !== a.dif) return b.dif - a.dif;
    return b.gf - a.gf;
  });
  const thirdPosMap = new Map<string, number>();
  allThirdsStats.slice(0, 8).forEach((t, i) => thirdPosMap.set(t.name, i));

  let art19bis = 0;
  // Only calculate if we have real results for all 12 groups
  if (allThirdsStats.length === 12) {
    const playerThirds: TeamStats[] = [];
    for (const g of groupKeys) {
      const pred = getPlayerGroupStandings(player, g, forecasts);
      if (pred[2]) playerThirds.push(pred[2]);
    }
    playerThirds.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dif !== a.dif) return b.dif - a.dif;
      return b.gf - a.gf;
    });
    playerThirds.forEach((pt, idx) => {
      if (idx < 8 && pt.name === allThirdsStats[idx]?.name) {
        art19bis += ART19BIS_SCALE[idx] ?? 5;
      }
    });
  }

  return { art18, art19, art19bis, total: art18 + art19 + art19bis };
}
