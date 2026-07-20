"use client";

import { DeleteButton } from "@components/shared/delete-button";
import { Badge } from "@components/ui/shadcn/badge";
import { deleteGalleryImage } from "@server/actions/galleries";
import type { Gallery } from "@server/db/schema";
import Image from "next/image";
import { GalleryFormDialog } from "./gallery-form";

export function GalleryGrid({ images }: { images: Gallery[] }) {
  return (
    <div className="grid gap-4 desktop:grid-cols-3">
      {images.map((image) => (
        <article
          key={image.id}
          className="flex flex-col overflow-hidden border bg-card shadow-xs"
        >
          <div className="relative aspect-video bg-muted">
            <Image
              src={image.imageUrl}
              alt={image.title}
              fill
              sizes="(min-width: 48rem) 33vw, 100vw"
              className="object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-1.5">
              <Badge variant="secondary">#{image.sortOrder}</Badge>
              <Badge variant={image.active ? "default" : "outline"}>
                {image.active ? "Active" : "Hidden"}
              </Badge>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-1 p-4">
            <h3 className="line-clamp-2 font-medium">{image.title}</h3>
            {image.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {image.description}
              </p>
            )}
            <div className="mt-3 flex items-center justify-end gap-2">
              <GalleryFormDialog image={image} />
              <DeleteButton
                action={deleteGalleryImage.bind(null, image.id)}
                title="Delete image?"
                description={`This will remove "${image.title}" from the public gallery.`}
              />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
