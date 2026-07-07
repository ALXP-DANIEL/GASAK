import { DataTable } from "@components/shared/data-table";
import { authSlides, db } from "@server/db";
import { desc } from "drizzle-orm";
import { requireDashboardRole } from "../_components/dashboard-section";
import { PageHeader } from "../_components/page-surface";
import { AuthSlideFormDialog } from "./_components/auth-slide-form";
import { columns } from "./_components/columns";

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
      <DataTable
        columns={columns}
        data={rows}
        emptyMessage="No auth slides yet. Add your first slide."
        searchColumnId="title"
        searchPlaceholder="Search slides..."
        facetedFilters={[
          {
            columnId: "status",
            title: "Status",
            options: [
              { value: "active", label: "Active" },
              { value: "hidden", label: "Hidden" },
            ],
          },
        ]}
      />
    </main>
  );
}
