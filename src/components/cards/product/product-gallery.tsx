"use client";

import { Icons } from "@components/icons";
import { BrandCard } from "@components/ui/brand";
import { cn } from "@lib/utils";
import Image from "next/image";
import { useState } from "react";

type GalleryItem = { id: string; imageUrl: string };

export function ProductGallery({
  images,
  alt,
}: {
  images: GalleryItem[];
  alt: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <BrandCard
        interactive={false}
        className="relative aspect-square overflow-hidden bg-secondary"
      >
        <div className="grid h-full place-items-center">
          <Icons.Domain.Shop size={64} className="text-primary/45" />
        </div>
      </BrandCard>
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div className="grid gap-3">
      <BrandCard
        interactive={false}
        className="relative aspect-square overflow-hidden bg-secondary"
      >
        <Image
          key={current.id}
          src={current.imageUrl}
          alt={alt}
          fill
          priority
          sizes="(min-width: 768px) 30rem, calc(100vw - 2rem)"
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background/80 to-transparent" />
      </BrandCard>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View image ${index + 1}`}
              className={cn(
                "relative aspect-square w-20 shrink-0 overflow-hidden rounded border-2 bg-secondary transition-colors",
                index === active
                  ? "border-primary"
                  : "border-transparent hover:border-primary/40",
              )}
            >
              <Image
                src={image.imageUrl}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
