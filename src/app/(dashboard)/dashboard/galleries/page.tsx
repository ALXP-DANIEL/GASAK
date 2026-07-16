import { Icons } from "@components/icons";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { db, galleries } from "@server/db";
import { desc } from "drizzle-orm";
import { requireDashboardRole } from "../_components/dashboard-section";
import { EmptyState, PageHeader } from "../_components/page-surface";
import { GalleryFormDialog } from "./_components/gallery-form";
import { GalleryGrid } from "./_components/gallery-grid";

export default async function GalleriesPage() {
  await requireDashboardRole("admin");

  const rows = await db
    .select()
    .from(galleries)
    .orderBy(galleries.sortOrder, desc(galleries.createdAt));

  return (
    <PageSkeleton name="galleries" loading={false}>
      <main>
        <PageHeader
          title="Gallery"
          kicker="System"
          icon={Icons.Editor.Image}
          description="Upload any number of images shown on the public gallery page."
        >
          <GalleryFormDialog />
        </PageHeader>
        {rows.length === 0 ? (
          <EmptyState
            message="No gallery images yet. Add your first image."
            icon={Icons.Editor.Image}
          />
        ) : (
          <GalleryGrid images={rows} />
        )}
      </main>
    </PageSkeleton>
  );
}
