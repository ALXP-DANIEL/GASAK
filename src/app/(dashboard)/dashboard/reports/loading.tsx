import { PageSkeleton } from "@components/shared/page-skeleton";

export default function ReportsLoading() {
  return (
    <PageSkeleton name="reports" loading>
      {null}
    </PageSkeleton>
  );
}
