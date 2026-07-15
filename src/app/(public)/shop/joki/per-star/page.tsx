"use cache";

import { Icons } from "@components/icons";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { BrandBadge, BrandCard, LinkButton } from "@components/ui/brand";
import { formatRM } from "@lib/format";
import { sortJokiTiers } from "@lib/joki";
import { createPageMetadata } from "@lib/metadata";
import { rankIconForJokiTierName } from "@lib/rank-icons";
import { db, jokiPackages, jokiServiceImages, jokiTiers } from "@server/db";
import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";
import { JokiCheckout } from "../joki-checkout";

export const metadata = createPageMetadata({
  title: "joki per star",
  description:
    "MLBB rank boost priced per star — GASAK players boost your account live on TikTok, safe and no cheats.",
  path: "/shop/joki/per-star",
  type: "Shop",
});

export default async function JokiPerStarPage() {
  cacheLife("hours");
  cacheTag("joki");

  const [tierRows, packageRows, serviceImage] = await Promise.all([
    db.select().from(jokiTiers).where(eq(jokiTiers.active, true)),
    db.select().from(jokiPackages).where(eq(jokiPackages.active, true)),
    db.query.jokiServiceImages.findFirst({
      where: eq(jokiServiceImages.mode, "per_star"),
    }),
  ]);
  const tiers = sortJokiTiers(tierRows);
  const cheapest = tiers[0];

  return (
    <PageSkeleton name="shop-joki-per-star" loading={false}>
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
                alt="Joki — Per Star"
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
              Joki Rank Boost — Per Star
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Pick your current and target rank — stars and price are calculated
              automatically across every rate tier the boost crosses. Pay 50%
              deposit to start; the rest is due once the boost is done.
            </p>

            {cheapest && (
              <p className="mt-4 font-mono text-lg font-semibold text-primary">
                from {formatRM(cheapest.pricePerStarSen)} / ⭐
              </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3 mobile:grid-cols-3 desktop:grid-cols-5">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card/60 p-3 text-center"
                >
                  {rankIconForJokiTierName(tier.name) && (
                    <Image
                      src={rankIconForJokiTierName(tier.name) as string}
                      alt=""
                      width={36}
                      height={36}
                      className="size-9 object-contain"
                    />
                  )}
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {tier.name}
                  </span>
                  <span className="text-sm font-bold">
                    {formatRM(tier.pricePerStarSen)}
                  </span>
                </div>
              ))}
            </div>
          </BrandCard>
        </section>

        <section className="mt-6">
          <JokiCheckout tiers={tiers} packages={packageRows} mode="per_star" />
        </section>
      </main>
    </PageSkeleton>
  );
}
