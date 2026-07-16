import { Icons } from "@components/icons";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { StatItem, StatStrip } from "@components/shared/stat-strip";
import { sortJokiPackages, sortJokiTiers } from "@lib/joki";
import { db, jokiPackages, jokiServiceImages, jokiTiers } from "@server/db";
import { requireOrgRole } from "@server/session";
import { PageHeader } from "../../_components/page-surface";
import { PackageFormDialog } from "./_components/package-form";
import { PackagesTable } from "./_components/packages-table";
import { ServiceImageForm } from "./_components/service-image-form";
import { TierFormDialog } from "./_components/tier-form";
import { TiersTable } from "./_components/tiers-table";

export default async function JokiConfigPage() {
  await requireOrgRole("admin", "seller");

  const [tierRows, packageRows, serviceImages] = await Promise.all([
    db.select().from(jokiTiers),
    db.select().from(jokiPackages),
    db.select().from(jokiServiceImages),
  ]);
  const tiers = sortJokiTiers(tierRows);
  const packages = sortJokiPackages(packageRows, tiers);
  const imageByMode = new Map(serviceImages.map((r) => [r.mode, r.imageUrl]));

  const activeTiers = tiers.filter((t) => t.active);
  const activePackages = packages.filter((p) => p.active);

  return (
    <PageSkeleton name="joki" loading={false}>
      <main>
        <PageHeader
          title="Joki Configuration"
          kicker="Commerce"
          icon={Icons.Domain.Joki}
          description="Per-star rates and flat-rate packages shown on /shop/joki."
        />

        <div className="flex flex-col gap-6">
          <StatStrip>
            <StatItem
              label="Active tiers"
              value={activeTiers.length}
              hint={`${tiers.length} tiers total`}
              icon={Icons.Domain.Joki}
            />
            <StatItem
              label="Active packages"
              value={activePackages.length}
              hint={`${packages.length} packages total`}
              icon={Icons.Domain.Shop}
            />
          </StatStrip>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Rank tiers</h2>
              <TierFormDialog configuredNames={tiers.map((t) => t.name)} />
            </div>
            <p className="text-sm text-muted-foreground">
              Per-star boosting rate for each tier, e.g. "Epic" at RM2/⭐.
            </p>
            <TiersTable rows={tiers} />
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Packages</h2>
              <PackageFormDialog tiers={tiers} packages={packages} />
            </div>
            <p className="text-sm text-muted-foreground">
              Flat-rate boosts between two tiers. The checkout auto-combines the
              cheapest chain of these to price any current → target range.
            </p>
            <PackagesTable rows={packages} tiers={tiers} />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Service page images</h2>
            <p className="text-sm text-muted-foreground">
              Shown on the /shop listing card and the detail page hero for each
              pricing mode — falls back to a generic icon until set.
            </p>
            <div className="grid gap-3">
              <ServiceImageForm
                mode="per_star"
                title="Joki — Per Star"
                currentImageUrl={imageByMode.get("per_star") ?? null}
              />
              <ServiceImageForm
                mode="package"
                title="Joki — Package Promo"
                currentImageUrl={imageByMode.get("package") ?? null}
              />
            </div>
          </section>
        </div>
      </main>
    </PageSkeleton>
  );
}
