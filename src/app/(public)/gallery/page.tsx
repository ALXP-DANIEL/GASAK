"use cache";

import { PageSkeleton } from "@components/shared/page-skeleton";
import { SectionHeader } from "@components/ui/brand";
import { listActiveGalleryImages } from "@features/galleries/queries";
import { createPageMetadata } from "@lib/metadata";
import { cn } from "@lib/utils";
import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";

// Repeating bento cycle on the 4-col desktop grid: a feature tile, small
// squares, and tall/wide accents. grid-flow-dense backfills any gaps.
const BENTO_PATTERN = [
  "col-span-2 row-span-2",
  "",
  "",
  "row-span-2",
  "",
  "col-span-2",
  "",
  "",
] as const;

export const metadata = createPageMetadata({
  title: "Gallery",
  description: "A look at the GASAK Esports family, moments, and merch.",
  path: "/gallery",
  type: "Gallery",
});

export default async function GalleryPage() {
  cacheLife("hours");
  cacheTag("galleries");

  const images = await listActiveGalleryImages();

  return (
    <PageSkeleton name="gallery-public" loading={false}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 desktop:px-8 desktop:py-14">
        <SectionHeader
          align="center"
          eyebrow="Gallery"
          title="Moments from GASAK"
          description="Snapshots of the squad, events, and everything in between."
        />

        {images.length === 0 ? (
          <p className="text-center text-muted-foreground">
            The gallery is being filled — check back soon.
          </p>
        ) : (
          <div className="grid grid-flow-dense auto-rows-36 grid-cols-2 gap-3 desktop:auto-rows-44 desktop:grid-cols-4 desktop:gap-4">
            {images.map((image, index) => (
              <figure
                key={image.id}
                className={cn(
                  "group relative overflow-hidden rounded-xl border bg-card",
                  BENTO_PATTERN[index % BENTO_PATTERN.length],
                )}
              >
                <Image
                  src={image.imageUrl}
                  alt={image.title}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-linear-to-b from-background/70 via-background/20 to-transparent"
                />
                <figcaption className="absolute inset-x-0 top-0 grid gap-0.5 p-4">
                  <h3 className="font-heading text-lg font-bold tracking-wide text-foreground">
                    {image.title}
                  </h3>
                  {image.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {image.description}
                    </p>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </PageSkeleton>
  );
}
