"use cache";

import { Icons } from "@components/icons";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { BrandBadge, BrandCard, LinkButton } from "@components/ui/brand";
import { formatRM } from "@lib/format";
import { sortJokiPackages, sortJokiTiers } from "@lib/joki";
import { createPageMetadata } from "@lib/metadata";
import { rankIconForJokiTierName } from "@lib/rank-icons";
import { db, jokiPackages, jokiServiceImages, jokiTiers } from "@server/db";
import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";
import { JokiCheckout } from "../joki-checkout";

export const metadata = createPageMetadata({
  title: "joki package",
  description:
    "MLBB rank boost flat-rate packages — jump straight from your current rank to your target rank at a fixed price.",
  path: "/shop/joki/package",
  type: "Shop",
});

export default async function JokiPackagePage() {
  cacheLife("hours");
  cacheTag("joki");

  const [tierRows, packageRowsRaw, serviceImage] = await Promise.all([
    db.select().from(jokiTiers).where(eq(jokiTiers.active, true)),
    db.select().from(jokiPackages).where(eq(jokiPackages.active, true)),
    db.query.jokiServiceImages.findFirst({
      where: eq(jokiServiceImages.mode, "package"),
    }),
  ]);
  const tiers = sortJokiTiers(tierRows);
  const packages = sortJokiPackages(packageRowsRaw, tiers);
  const cheapest = packages.reduce<(typeof packages)[number] | undefined>(
    (min, pkg) => (!min || pkg.priceSen < min.priceSen ? pkg : min),
    undefined,
  );

  return (
    <PageSkeleton name="shop-joki-package" loading={false}>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 desktop:px-8 desktop:py-12">
        <div className="mb-6">
          <LinkButton href="/shop" size="sm">
            Back to shop
          </LinkButton>
        </div>

        <section className="grid gap-6 desktop:grid-cols-[minmax(20rem,30rem)_minmax(0,1fr)]">
          <BrandCard
            interactive={false}
            className="relative aspect-square overflow-hidden bg-secondary"
          >
            {serviceImage?.imageUrl ? (
              <Image
                src={serviceImage.imageUrl}
                alt="Joki — Package Promo"
                fill
                priority
                sizes="(min-width: 768px) 30rem, calc(100vw - 2rem)"
                className="object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center">
                <Icons.Domain.Shop size={64} className="text-primary/45" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background/80 to-transparent" />
          </BrandCard>

          <BrandCard interactive={false} className="p-5 desktop:p-7">
            <BrandBadge>Joki</BrandBadge>
            <h1 className="mt-4 text-balance font-heading text-3xl font-bold uppercase leading-tight tracking-wide text-foreground desktop:text-5xl">
              Joki Rank Boost — Package Promo
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Want to jump further — say Epic straight to Glory? Pick any
              current → target rank at checkout and the price auto-combines the
              cheapest mix of these flat-rate promos.
            </p>

            {cheapest && (
              <p className="mt-4 font-mono text-lg font-semibold text-primary">
                from {formatRM(cheapest.priceSen)}
              </p>
            )}

            <div className="mt-6 grid gap-3 mobile:grid-cols-2">
              {packages.map((pkg) => {
                const fromTier = tiers.find((t) => t.id === pkg.fromTierId);
                const toTier = tiers.find((t) => t.id === pkg.toTierId);
                const fromIcon = fromTier
                  ? rankIconForJokiTierName(fromTier.name)
                  : undefined;
                const toIcon = toTier
                  ? rankIconForJokiTierName(toTier.name)
                  : undefined;
                return (
                  <div
                    key={pkg.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card/60 px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      {fromIcon && toIcon && (
                        <div className="flex items-center gap-1">
                          <Image
                            src={fromIcon}
                            alt=""
                            width={24}
                            height={24}
                            className="size-6 object-contain"
                          />
                          <span className="text-muted-foreground">→</span>
                          <Image
                            src={toIcon}
                            alt=""
                            width={24}
                            height={24}
                            className="size-6 object-contain"
                          />
                        </div>
                      )}
                      <span className="text-sm font-medium">{pkg.name}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {formatRM(pkg.priceSen)}
                    </span>
                  </div>
                );
              })}
            </div>
          </BrandCard>
        </section>

        <section className="mt-6">
          <JokiCheckout
            tiers={tiers}
            packages={packageRowsRaw}
            mode="package"
          />
        </section>
      </main>
    </PageSkeleton>
  );
}
