"use client";

import { Icons } from "@components/icons";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@components/ui/shadcn/carousel";
import { cn } from "@lib/utils";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type GalleryItem = { id: string; imageUrl: string };

/** Auto-advance interval for the slideshow. */
const AUTOPLAY_MS = 5000;

/**
 * Wide 16:9 slideshow for product imagery, built on the shadcn/embla carousel.
 *
 * Uses embla's Autoplay plugin, which handles pausing on hover and stopping
 * once the viewer drags or uses the arrows, so the slideshow never fights
 * someone browsing manually.
 */
export function ProductCarousel({
  images,
  alt,
}: {
  images: GalleryItem[];
  alt: string;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  // Held in a ref so the plugin instance is stable across re-renders.
  const autoplay = useRef(
    Autoplay({ delay: AUTOPLAY_MS, stopOnInteraction: true }),
  );

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (images.length === 0) {
    return (
      <div className="relative aspect-video w-full overflow-hidden border border-border bg-secondary">
        <div className="grid h-full place-items-center">
          <Icons.Domain.Shop size={64} className="text-primary/45" />
        </div>
      </div>
    );
  }

  const multiple = images.length > 1;

  return (
    <div className="grid gap-3">
      <Carousel
        setApi={setApi}
        className="w-full"
        opts={{ align: "start", loop: multiple }}
        plugins={multiple ? [autoplay.current] : []}
      >
        <CarouselContent className="ml-0">
          {images.map((image, index) => (
            <CarouselItem key={image.id} className="pl-0">
              <div className="relative aspect-video w-full overflow-hidden border border-border bg-secondary">
                <Image
                  src={image.imageUrl}
                  alt={index === 0 ? alt : ""}
                  fill
                  priority={index === 0}
                  sizes="(min-width: 768px) 80rem, 100vw"
                  className="object-cover"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {multiple && (
          <>
            <CarouselPrevious className="left-3" />
            <CarouselNext className="right-3" />
          </>
        )}
      </Carousel>

      {multiple && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => api?.scrollTo(index)}
              aria-label={`View image ${index + 1}`}
              aria-current={index === current}
              className={cn(
                "relative aspect-video w-28 shrink-0 overflow-hidden rounded border-2 bg-secondary transition-colors",
                index === current
                  ? "border-primary"
                  : "border-transparent hover:border-primary/40",
              )}
            >
              <Image
                src={image.imageUrl}
                alt=""
                fill
                sizes="112px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
