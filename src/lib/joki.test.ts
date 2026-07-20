import type { JokiPackage, JokiTier } from "@server/db/schema";
import { describe, expect, it } from "vitest";
import {
  computeJokiPackagePath,
  computeJokiStarPath,
  sortJokiTiers,
} from "./joki";

// Only the fields the pricing logic reads — the rest of the row is irrelevant.
function mkTier(id: string, name: string, pricePerStarSen: number): JokiTier {
  return { id, name, pricePerStarSen } as JokiTier;
}

function mkPackage(
  id: string,
  fromTierId: string,
  toTierId: string,
  priceSen: number,
): JokiPackage {
  return {
    id,
    name: `${fromTierId} → ${toTierId}`,
    fromTierId,
    toTierId,
    priceSen,
  } as JokiPackage;
}

const epic = mkTier("epic", "Epic", 200);
const legend = mkTier("legend", "Legend", 300);
const mythic = mkTier("mythic", "Mythic", 350);

describe("sortJokiTiers", () => {
  it("orders tiers by the real MLBB ladder regardless of input order", () => {
    const sorted = sortJokiTiers([mythic, epic, legend]);
    expect(sorted.map((t) => t.name)).toEqual(["Epic", "Legend", "Mythic"]);
  });
});

describe("computeJokiStarPath", () => {
  const tiers = [epic, legend];

  it("prices a within-tier climb at that tier's rate", () => {
    // Epic V 0★ → Epic V 3★ = 3 stars at 200 sen each.
    const path = computeJokiStarPath(
      tiers,
      { tier: "Epic", division: 5, stars: 0 },
      { tier: "Epic", division: 5, stars: 3 },
    );
    expect(path).not.toBeNull();
    expect(path?.totalStars).toBe(3);
    expect(path?.totalSen).toBe(3 * 200);
    expect(path?.legs).toEqual([{ tierName: "Epic", stars: 3, priceSen: 600 }]);
  });

  it("splits a cross-tier climb into per-tier legs at each tier's rate", () => {
    // Epic I 4★ is the last Epic star; Legend V 2★ is 2 stars into Legend.
    const path = computeJokiStarPath(
      tiers,
      { tier: "Epic", division: 1, stars: 4 },
      { tier: "Legend", division: 5, stars: 2 },
    );
    expect(path).not.toBeNull();
    expect(path?.totalStars).toBe(3);
    expect(path?.legs).toEqual([
      { tierName: "Epic", stars: 1, priceSen: 200 },
      { tierName: "Legend", stars: 2, priceSen: 600 },
    ]);
    expect(path?.totalSen).toBe(800);
  });

  it("rejects a descending or equal range", () => {
    const from = { tier: "Legend", division: 5, stars: 2 };
    const to = { tier: "Epic", division: 1, stars: 4 };
    expect(computeJokiStarPath(tiers, from, to)).toBeNull();
    expect(computeJokiStarPath(tiers, from, from)).toBeNull();
  });

  it("rejects a climb that crosses a tier joki does not price", () => {
    // Legend → Mythic with no Mythic rate configured.
    const path = computeJokiStarPath(
      tiers,
      { tier: "Legend", division: 1, stars: 3 },
      { tier: "Mythic", division: null, stars: 5 },
    );
    expect(path).toBeNull();
  });
});

describe("computeJokiPackagePath", () => {
  const tiers = [epic, legend, mythic];

  it("prices a direct package edge", () => {
    const packages = [mkPackage("p1", "epic", "legend", 1500)];
    const path = computeJokiPackagePath(tiers, packages, "epic", "legend");
    expect(path?.totalSen).toBe(1500);
    expect(path?.legs).toHaveLength(1);
  });

  it("chains segments when the chain is cheaper than the direct edge", () => {
    const packages = [
      mkPackage("p1", "epic", "legend", 1500),
      mkPackage("p2", "legend", "mythic", 6000),
      mkPackage("p3", "epic", "mythic", 8000),
    ];
    const path = computeJokiPackagePath(tiers, packages, "epic", "mythic");
    expect(path?.totalSen).toBe(7500);
    expect(path?.legs).toHaveLength(2);
  });

  it("takes the direct edge when it beats the chain", () => {
    const packages = [
      mkPackage("p1", "epic", "legend", 1500),
      mkPackage("p2", "legend", "mythic", 6000),
      mkPackage("p3", "epic", "mythic", 7000),
    ];
    const path = computeJokiPackagePath(tiers, packages, "epic", "mythic");
    expect(path?.totalSen).toBe(7000);
    expect(path?.legs).toHaveLength(1);
  });

  it("returns null when the packages cannot cover the range", () => {
    const packages = [mkPackage("p1", "epic", "legend", 1500)];
    expect(
      computeJokiPackagePath(tiers, packages, "epic", "mythic"),
    ).toBeNull();
  });

  it("returns null for a descending range", () => {
    const packages = [mkPackage("p1", "epic", "legend", 1500)];
    expect(
      computeJokiPackagePath(tiers, packages, "legend", "epic"),
    ).toBeNull();
  });
});
