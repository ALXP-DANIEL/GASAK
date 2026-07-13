import { Icons } from "@components/icons";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { authSlides, db } from "@server/db";
import { desc } from "drizzle-orm";
import { requireDashboardRole } from "../_components/dashboard-section";
import { EmptyState, PageHeader } from "../_components/page-surface";
import { AuthSlideFormDialog } from "./_components/auth-slide-form";
import { SlidesGrid } from "./_components/slides-grid";

export default async function AuthSlidesPage() {
  await requireDashboardRole("admin");

  const rows = await db
    .select()
    .from(authSlides)
    .orderBy(authSlides.sortOrder, desc(authSlides.createdAt));

  return (
    <PageSkeleton name="auth-slides" loading={false}>
      <main>
        <PageHeader
          title="Auth Slides"
          kicker="System"
          icon={Icons.Editor.Image}
          description="Manage the carousel shown beside login, reset password, and forgot password pages."
        >
          <AuthSlideFormDialog />
        </PageHeader>
        {rows.length === 0 ? (
          <EmptyState
            message="No auth slides yet. Add your first slide."
            icon={Icons.Editor.Image}
          />
        ) : (
          <SlidesGrid slides={rows} />
        )}
      </main>
    </PageSkeleton>
  );
}
