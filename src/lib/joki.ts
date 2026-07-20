import {
  isRankTier,
  normalizeRank,
  RANK_TIERS,
  rankAbsoluteIndex,
  tierStarCapacity,
} from "@lib/ranks";
import type { JokiPackage, JokiTier } from "@server/db/schema";

// A joki tier's `name` is always one of the 10 real MLBB rank tier strings
// (see RANK_TIERS in @lib/ranks) — admins pick from that fixed list, so
// hierarchy/position falls straight out of RANK_TIERS with no alias table.

/** Finds the joki pricing tier row for whatever precise rank the buyer picked. */
export function resolveJokiTier(
  tiers: JokiTier[],
  rank: unknown,
): JokiTier | undefined {
  const parsed = normalizeRank(rank);
  if (!parsed) return undefined;
  return tiers.find((t) => t.name === parsed.tier);
}

/**
 * A joki tier's position in the real MLBB rank ladder (Warrior < … < Mythical
 * Immortal) — the single source of display/traversal order, so there's no
 * manual sort field to keep in sync with the actual hierarchy.
 */
export function jokiTierHierarchyIndex(tierName: string): number {
  const index = isRankTier(tierName) ? RANK_TIERS.indexOf(tierName) : -1;
  return index === -1 ? Number.POSITIVE_INFINITY : index;
}

/** Sorts joki tiers by real rank hierarchy (Epic → Legend → … → Glory). */
export function sortJokiTiers(tiers: JokiTier[]): JokiTier[] {
  return [...tiers].sort(
    (a, b) => jokiTierHierarchyIndex(a.name) - jokiTierHierarchyIndex(b.name),
  );
}

/** Sorts joki packages by their starting tier's hierarchy, then target tier's. */
export function sortJokiPackages(
  packages: JokiPackage[],
  tiers: JokiTier[],
): JokiPackage[] {
  const nameById = new Map(tiers.map((t) => [t.id, t.name]));
  const indexOf = (id: string | null) => {
    const name = id ? nameById.get(id) : undefined;
    return name ? jokiTierHierarchyIndex(name) : Number.POSITIVE_INFINITY;
  };
  return [...packages].sort((a, b) => {
    const fromDiff = indexOf(a.fromTierId) - indexOf(b.fromTierId);
    return fromDiff !== 0
      ? fromDiff
      : indexOf(a.toTierId) - indexOf(b.toTierId);
  });
}

export type JokiPathLeg = { name: string; priceSen: number };

export type JokiPackagePath = {
  totalSen: number;
  legs: JokiPathLeg[];
};

/**
 * Prices an arbitrary from→to tier range as the cheapest chain of package
 * segments (shortest path over the package edges). Returns null when the
 * range can't be covered by the available packages. Shared by the public
 * checkout (live preview) and placeJokiOrder (authoritative price).
 */
export function computeJokiPackagePath(
  tiers: JokiTier[],
  packages: JokiPackage[],
  fromTierId: string,
  toTierId: string,
): JokiPackagePath | null {
  const ordered = sortJokiTiers(tiers);
  const indexById = new Map(ordered.map((t, i) => [t.id, i]));

  const from = indexById.get(fromTierId);
  const to = indexById.get(toTierId);
  if (from === undefined || to === undefined || from >= to) return null;

  // Forward edges only — a package boosts up the ladder.
  const edges = packages
    .map((pkg) => {
      const a = pkg.fromTierId ? indexById.get(pkg.fromTierId) : undefined;
      const b = pkg.toTierId ? indexById.get(pkg.toTierId) : undefined;
      if (a === undefined || b === undefined || a >= b) return null;
      return { from: a, to: b, pkg };
    })
    .filter((e) => e !== null);

  // Dijkstra over a handful of tiers — the graph is tiny.
  const best = new Array<number>(ordered.length).fill(Number.POSITIVE_INFINITY);
  const via = new Array<(typeof edges)[number] | null>(ordered.length).fill(
    null,
  );
  best[from] = 0;
  for (let i = from; i < to; i++) {
    if (!Number.isFinite(best[i])) continue;
    for (const edge of edges) {
      if (edge.from !== i) continue;
      const cost = best[i] + edge.pkg.priceSen;
      if (cost < best[edge.to]) {
        best[edge.to] = cost;
        via[edge.to] = edge;
      }
    }
  }
  if (!Number.isFinite(best[to])) return null;

  const legs: JokiPathLeg[] = [];
  for (let i = to; i !== from; ) {
    const edge = via[i];
    if (!edge) return null;
    legs.unshift({ name: edge.pkg.name, priceSen: edge.pkg.priceSen });
    i = edge.from;
  }
  return { totalSen: best[to], legs };
}

export type JokiStarLeg = { tierName: string; stars: number; priceSen: number };

export type JokiStarPath = {
  totalStars: number;
  totalSen: number;
  legs: JokiStarLeg[];
};

/**
 * Prices a per-star boost from one precise rank to another, splitting the
 * climb across every rate tier it crosses (e.g. Epic → Legend charges the
 * remaining Epic stars at the Epic rate, then the Legend stars at the
 * Legend rate). Returns null when the range is invalid or leaves the
 * Epic..Glory range joki supports. Shared by the checkout preview and
 * placeJokiOrder for the authoritative price.
 */
export function computeJokiStarPath(
  tiers: JokiTier[],
  fromRank: unknown,
  toRank: unknown,
): JokiStarPath | null {
  const fromIdx = rankAbsoluteIndex(fromRank);
  const toIdx = rankAbsoluteIndex(toRank);
  if (fromIdx === null || toIdx === null || toIdx <= fromIdx) return null;
  if (!resolveJokiTier(tiers, fromRank) || !resolveJokiTier(tiers, toRank)) {
    return null;
  }

  const legs: JokiStarLeg[] = [];
  let cumulative = 0;
  for (const t of RANK_TIERS) {
    const capacity = tierStarCapacity(t);
    const tierStart = cumulative;
    const tierEnd = tierStart + capacity;
    cumulative += capacity;

    const stars = Math.min(toIdx, tierEnd) - Math.max(fromIdx, tierStart);
    if (stars <= 0) continue;

    const jokiTier = tiers.find((jt) => jt.name === t);
    if (!jokiTier) return null; // crosses a tier joki doesn't price
    legs.push({
      tierName: t,
      stars,
      priceSen: stars * jokiTier.pricePerStarSen,
    });
  }

  const totalSen = legs.reduce((sum, leg) => sum + leg.priceSen, 0);
  return { totalStars: toIdx - fromIdx, totalSen, legs };
}
