"use client";

import { DeleteButton } from "@components/shared/delete-button";
import { Badge } from "@components/ui/shadcn/badge";
import { deleteAuthSlide } from "@server/actions/auth-slides";
import type { AuthSlide } from "@server/db/schema";
import Image from "next/image";
import { AuthSlideFormDialog } from "./auth-slide-form";

export function SlidesGrid({ slides }: { slides: AuthSlide[] }) {
  return (
    <div className="grid gap-4 desktop:grid-cols-3">
      {slides.map((slide) => (
        <article
          key={slide.id}
          className="flex flex-col overflow-hidden border bg-card shadow-xs"
        >
          <div className="relative aspect-video bg-muted">
            <Image
              src={slide.imageUrl}
              alt={slide.title}
              fill
              sizes="(min-width: 48rem) 33vw, 100vw"
              className="object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-1.5">
              <Badge variant="secondary">#{slide.sortOrder}</Badge>
              <Badge variant={slide.active ? "default" : "outline"}>
                {slide.active ? "Active" : "Hidden"}
              </Badge>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-1 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {slide.eyebrow}
            </p>
            <h3 className="line-clamp-2 font-medium">{slide.title}</h3>
            {slide.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {slide.description}
              </p>
            )}
            <div className="mt-3 flex items-center justify-end gap-2">
              <AuthSlideFormDialog slide={slide} />
              <DeleteButton
                action={deleteAuthSlide.bind(null, slide.id)}
                title="Delete slide?"
                description={`This will remove "${slide.title}" from the auth carousel.`}
              />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
