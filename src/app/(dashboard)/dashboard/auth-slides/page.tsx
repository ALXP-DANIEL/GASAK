import { desc } from "drizzle-orm";
import Image from "next/image";
import { DeleteButton } from "@/components/shared/delete-button";
import { Badge } from "@/components/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { deleteAuthSlide } from "@/server/actions/auth-slides";
import { authSlides, db } from "@/server/db";
import { requireDashboardRole } from "../_components/dashboard-section";
import { EmptyState, PageHeader } from "../_components/page-surface";
import { AuthSlideFormDialog } from "./_components/auth-slide-form";

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
        <div className="grid gap-4 desktop:grid-cols-2 xl:grid-cols-3">
          {rows.map((slide) => (
            <Card key={slide.id} className="overflow-hidden shadow-xs">
              <div className="relative h-44 border-b">
                <Image
                  src={slide.imageUrl}
                  alt={slide.title}
                  fill
                  sizes="33vw"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {slide.eyebrow}
                    </p>
                    <CardTitle className="mt-1 line-clamp-2 text-base">
                      {slide.title}
                    </CardTitle>
                  </div>
                  <Badge variant={slide.active ? "default" : "outline"}>
                    {slide.active ? "Active" : "Hidden"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {slide.description}
                </p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Sort order: {slide.sortOrder}
                </p>
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <AuthSlideFormDialog slide={slide} />
                <DeleteButton
                  action={deleteAuthSlide.bind(null, slide.id)}
                  title="Delete slide?"
                  description={`This will remove "${slide.title}" from the auth carousel.`}
                />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
