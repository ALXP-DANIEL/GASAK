import { PageSkeleton } from "@components/shared/page-skeleton";

export default function SchedulesLoading() {
  return (
    <PageSkeleton name="schedules" loading>
      {null}
    </PageSkeleton>
  );
}
