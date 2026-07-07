"use client";

import type { CarouselApi } from "@components/ui/shadcn/carousel";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@components/ui/shadcn/carousel";
import type { AuthCarouselSlide } from "@features/auth-slides/queries";
import { cn } from "@lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";

export function AuthSideCarousel({ slides }: { slides?: AuthCarouselSlide[] }) {
  const activeSlides = slides ?? [];
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!api || activeSlides.length === 0) return;

    const updateSelected = () => setSelected(api.selectedScrollSnap());
    updateSelected();
    api.on("select", updateSelected);

    const interval = window.setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
        return;
      }
      api.scrollTo(0);
    }, 5000);

    return () => {
      window.clearInterval(interval);
      api.off("select", updateSelected);
    };
  }, [api, activeSlides.length]);

  if (activeSlides.length === 0) return null;

  return (
    <div className="relative h-full overflow-hidden rounded-xl border border-primary/20 bg-card">
      <Carousel
        setApi={setApi}
        opts={{ loop: true }}
        className="h-full *:data-[slot=carousel-content]:h-full"
        aria-label="GASAK login highlights"
      >
        <CarouselContent className="h-full ml-0 *:data-[slot=carousel-item]:h-full">
          {activeSlides.map((slide, index) => (
            <CarouselItem key={slide.id} className="h-full pl-0">
              <div className="relative h-full overflow-hidden">
                <Image
                  src={slide.imageUrl}
                  alt=""
                  fill
                  priority={index === 0}
                  sizes="50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-background via-background/35 to-transparent" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 min-h-56 p-8">
        {activeSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-x-8 bottom-8 transition-all duration-500 ease-out",
              selected === index
                ? "translate-y-0 opacity-100"
                : "translate-y-3 opacity-0",
            )}
            aria-hidden={selected !== index}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              {slide.eyebrow}
            </p>
            <h2 className="mt-3 max-w-md font-heading text-3xl font-bold tracking-wide text-foreground">
              {slide.title}
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
              {slide.description}
            </p>
          </div>
        ))}
      </div>

      <div className="absolute right-8 bottom-8 flex gap-2">
        {activeSlides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Show slide ${index + 1}`}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              selected === index ? "w-8 bg-primary" : "w-2 bg-foreground/35",
            )}
          />
        ))}
      </div>
    </div>
  );
}
