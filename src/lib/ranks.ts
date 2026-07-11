import { z } from "zod";

/* ------------------------------------------------------------------ *
 * MLBB rank system (2026 consensus)
 *
 * Six lower tiers use Roman-numeral divisions + stars; the four Mythic
 * tiers use a flat star count (no divisions). A player's rank is stored
 * as a structured object { tier, division, stars } (see {@link MlbbRank}).
 * ------------------------------------------------------------------ */

export const RANK_TIERS = [
  "Warrior",
  "Elite",
  "Master",
  "Grandmaster",
  "Epic",
  "Legend",
  "Mythic",
  "Mythical Honor",
  "Mythical Glory",
  "Mythical Immortal",
] as const;

export type RankTier = (typeof RANK_TIERS)[number];

/** Lower six tiers: divisions (Roman) + stars-per-division. */
export const DIVISIONED_RANKS: Record<
  "Warrior" | "Elite" | "Master" | "Grandmaster" | "Epic" | "Legend",
  { divisions: number; starsPerDivision: number }
> = {
  Warrior: { divisions: 3, starsPerDivision: 3 },
  Elite: { divisions: 3, starsPerDivision: 4 },
  Master: { divisions: 4, starsPerDivision: 4 },
  Grandmaster: { divisions: 5, starsPerDivision: 5 },
  Epic: { divisions: 5, starsPerDivision: 5 },
  Legend: { divisions: 5, starsPerDivision: 5 },
};

/** Upper four tiers: flat star ranges (no divisions). */
export const MYTHIC_RANKS: Record<
  "Mythic" | "Mythical Honor" | "Mythical Glory" | "Mythical Immortal",
  { min: number; max: number; uncapped?: boolean }
> = {
  Mythic: { min: 0, max: 24 },
  "Mythical Honor": { min: 25, max: 49 },
  "Mythical Glory": { min: 50, max: 99 },
  "Mythical Immortal": { min: 100, max: Infinity, uncapped: true },
};

/** A structured MLBB rank. division is 1-based (I=1 highest … V=5 lowest). */
export type MlbbRank = {
  tier: RankTier;
  division: number | null;
  stars: number;
};

const ROMAN = ["", "I", "II", "III", "IV", "V"];

export function toRoman(n: number | null | undefined): string {
  if (!n || n < 1 || n > 5) return "";
  return ROMAN[n];
}

export type DivisionedTier = keyof typeof DIVISIONED_RANKS;
export type MythicTier = keyof typeof MYTHIC_RANKS;

export function isRankTier(value: unknown): value is RankTier {
  return (
    typeof value === "string" &&
    (RANK_TIERS as readonly string[]).includes(value)
  );
}

export function isDivisioned(tier: RankTier): tier is DivisionedTier {
  return tier in DIVISIONED_RANKS;
}

/** True for tiers whose star count has no upper limit (e.g. Mythical Immortal). */
export function isUncappedRank(tier: RankTier): boolean {
  return (
    tier in MYTHIC_RANKS &&
    Boolean(
      (MYTHIC_RANKS[tier as MythicTier] as { uncapped?: boolean }).uncapped,
    )
  );
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

/** Star bounds for a tier (used to constrain the stars input). */
export function rankStarBounds(tier: RankTier): { min: number; max: number } {
  if (isDivisioned(tier)) {
    return { min: 0, max: DIVISIONED_RANKS[tier].starsPerDivision - 1 };
  }
  return MYTHIC_RANKS[tier];
}

/** Coerce arbitrary input into a canonical {@link MlbbRank}, or null if invalid. */
export function normalizeRank(input: unknown): MlbbRank | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Partial<MlbbRank>;
  if (!isRankTier(raw.tier)) return null;

  const tier = raw.tier;
  if (isDivisioned(tier)) {
    const { divisions, starsPerDivision } = DIVISIONED_RANKS[tier];
    const division = clamp(Number(raw.division ?? divisions), 1, divisions);
    const stars = clamp(Number(raw.stars ?? 0), 0, starsPerDivision - 1);
    return { tier, division, stars };
  }

  const { min, max } = MYTHIC_RANKS[tier];
  const stars = clamp(Number(raw.stars ?? min), min, max);
  return { tier, division: null, stars };
}

/** Human-readable label, e.g. "Legend V · 3★" or "Mythical Honor 30★". */
export function formatRank(rank: unknown, fallback = "—"): string {
  const r = normalizeRank(rank);
  if (!r) return fallback;
  if (isDivisioned(r.tier)) {
    return `${r.tier} ${toRoman(r.division)} · ${r.stars}★`;
  }
  return `${r.tier} ${r.stars}★`;
}

/** Monotonic number for sorting (higher = stronger). */
export function rankOrder(rank: unknown): number {
  const r = normalizeRank(rank);
  if (!r) return -1;
  const tierIndex = RANK_TIERS.indexOf(r.tier);
  if (isDivisioned(r.tier)) {
    const { divisions, starsPerDivision } = DIVISIONED_RANKS[r.tier];
    const divisionStrength = divisions - (r.division ?? divisions);
    return (
      tierIndex * 1000 + divisionStrength * starsPerDivision + (r.stars ?? 0)
    );
  }
  return tierIndex * 1000 + (r.stars ?? 0);
}

/** Order of a tier's weakest possible rank (used to disable tiers above a cap). */
export function tierBaseOrder(tier: RankTier): number {
  return RANK_TIERS.indexOf(tier) * 1000;
}

/** Zod schema for a rank field value (object form). */
export const rankFieldSchema = z
  .object({
    tier: z.enum(RANK_TIERS),
    division: z.number().int().nullable(),
    stars: z.number().int().min(0),
  })
  .transform(normalizeRank)
  .pipe(z.custom<MlbbRank>((v) => v !== null, "Invalid rank"));

/** Tier options for the first selector. */
export const RANK_TIER_OPTIONS = RANK_TIERS.map((tier) => ({
  value: tier,
  label: tier,
}));
