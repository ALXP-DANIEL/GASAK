import { db, galleries } from "@server/db";
import { asc } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

export type GalleryImage = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
};

export async function listActiveGalleryImages(): Promise<GalleryImage[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("galleries");

  const rows = await db.query.galleries.findMany({
    where: (image, { eq }) => eq(image.active, true),
    orderBy: [asc(galleries.sortOrder), asc(galleries.createdAt)],
  });

  return rows.map((image) => ({
    id: image.id,
    title: image.title,
    description: image.description,
    imageUrl: image.imageUrl,
  }));
}

export function listDashboardGalleryImages() {
  return db.query.galleries.findMany({
    orderBy: [asc(galleries.sortOrder), asc(galleries.createdAt)],
  });
}
