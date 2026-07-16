import { Icons } from "@components/icons";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { authImages, db } from "@server/db";
import { desc } from "drizzle-orm";
import { requireDashboardRole } from "../_components/dashboard-section";
import { EmptyState, PageHeader } from "../_components/page-surface";
import { AuthImageFormDialog } from "./_components/auth-image-form";
import { SlidesGrid } from "./_components/images-grid";

export default async function AuthImagesPage() {
  await requireDashboardRole("admin");

  const rows = await db
    .select()
    .from(authImages)
    .orderBy(desc(authImages.createdAt));

  return (
    <PageSkeleton name="auth-images" loading={false}>
      <main>
        <PageHeader
          title="Auth Images"
          kicker="System"
          icon={Icons.Editor.Image}
          description="Manage the image grid shown as the background behind login, reset password, and forgot password pages."
        >
          <AuthImageFormDialog />
        </PageHeader>
        {rows.length === 0 ? (
          <EmptyState
            message="No auth images yet. Add your first image."
            icon={Icons.Editor.Image}
          />
        ) : (
          <SlidesGrid slides={rows} />
        )}
      </main>
    </PageSkeleton>
  );
}
