"use client";

import { DeleteButton } from "@components/shared/delete-button";
import { Badge } from "@components/ui/shadcn/badge";
import { deleteAuthImage } from "@server/actions/auth-images";
import type { AuthImage } from "@server/db/schema";
import Image from "next/image";
import { AuthImageFormDialog } from "./auth-image-form";

export function SlidesGrid({ slides }: { slides: AuthImage[] }) {
  return (
    <div className="grid gap-4 desktop:grid-cols-3">
      {slides.map((slide) => (
        <article
          key={slide.id}
          className="flex flex-col overflow-hidden border bg-card shadow-xs"
        >
          <div className="relative aspect-square bg-muted">
            <Image
              src={slide.imageUrl}
              alt=""
              fill
              sizes="(min-width: 48rem) 33vw, 100vw"
              className="object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-1.5">
              <Badge variant={slide.active ? "default" : "outline"}>
                {slide.active ? "Active" : "Hidden"}
              </Badge>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2 p-4">
            <AuthImageFormDialog slide={slide} />
            <DeleteButton
              action={deleteAuthImage.bind(null, slide.id)}
              title="Delete image?"
              description="This will remove the image from the auth background grid."
            />
          </div>
        </article>
      ))}
    </div>
  );
}
