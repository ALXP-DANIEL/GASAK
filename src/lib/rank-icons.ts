import { isRankTier, type RankTier } from "@lib/ranks";

/** Official MLBB rank badge art, self-hosted under public/images/ranks. */
export const RANK_TIER_ICON: Record<RankTier, string> = {
  Warrior: "/images/ranks/warrior.webp",
  Elite: "/images/ranks/elite.webp",
  Master: "/images/ranks/master.webp",
  Grandmaster: "/images/ranks/grandmaster.webp",
  Epic: "/images/ranks/epic.webp",
  Legend: "/images/ranks/legend.webp",
  Mythic: "/images/ranks/mythic.webp",
  "Mythical Honor": "/images/ranks/mythical-honor.webp",
  "Mythical Glory": "/images/ranks/mythical-glory.webp",
  "Mythical Immortal": "/images/ranks/mythical-immortal.webp",
};

export const RANK_STAR_ICON = "/images/ranks/star.webp";

/**
 * A joki pricing tier's `name` is always one of the 10 real MLBB rank tier
 * strings (see RANK_TIERS in @lib/ranks) — no alias table needed.
 */
export function rankIconForJokiTierName(name: string): string | undefined {
  return isRankTier(name) ? RANK_TIER_ICON[name] : undefined;
}
