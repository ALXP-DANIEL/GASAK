import { authImages, db } from "@server/db";
import { asc } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

export type AuthBackdropImage = {
  id: string;
  imageUrl: string;
};

export async function listActiveAuthImages(): Promise<AuthBackdropImage[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("auth-images");

  const rows = await db.query.authImages.findMany({
    where: (slide, { eq }) => eq(slide.active, true),
    orderBy: [asc(authImages.createdAt)],
  });

  return rows.map((slide) => ({
    id: slide.id,
    imageUrl: slide.imageUrl,
  }));
}
