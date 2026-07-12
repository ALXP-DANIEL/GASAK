import { authSlides, db } from "@server/db";
import { asc } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

export type AuthCarouselSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string;
};

export async function listActiveAuthSlides(): Promise<AuthCarouselSlide[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("auth-slides");

  const rows = await db.query.authSlides.findMany({
    where: (slide, { eq }) => eq(slide.active, true),
    orderBy: [asc(authSlides.sortOrder), asc(authSlides.createdAt)],
  });

  return rows.map((slide) => ({
    id: slide.id,
    eyebrow: slide.eyebrow,
    title: slide.title,
    description: slide.description,
    imageUrl: slide.imageUrl,
  }));
}

export function listDashboardAuthSlides() {
  return db.query.authSlides.findMany({
    orderBy: [asc(authSlides.sortOrder), asc(authSlides.createdAt)],
  });
}
