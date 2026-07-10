import { authSlides, db } from "@server/db";
import { desc } from "drizzle-orm";
import { requireDashboardRole } from "../_components/dashboard-section";
import { EmptyState, PageHeader } from "../_components/page-surface";
import { AuthSlideFormDialog } from "./_components/auth-slide-form";
import { SlidesGrid } from "./_components/slides-grid";

export const dynamic = "force-dynamic";

export default async function AuthSlidesPage() {
  await requireDashboardRole("admin");

  const rows = await db
    .select()
    .from(authSlides)
    .orderBy(authSlides.sortOrder, desc(authSlides.createdAt));

  return (
    <main>
      <PageHeader
        title="Auth Slides"
        description="Manage the carousel shown beside login, reset password, and forgot password pages."
      >
        <AuthSlideFormDialog />
      </PageHeader>
      {rows.length === 0 ? (
        <EmptyState message="No auth slides yet. Add your first slide." />
      ) : (
        <SlidesGrid slides={rows} />
      )}
    </main>
  );
}
