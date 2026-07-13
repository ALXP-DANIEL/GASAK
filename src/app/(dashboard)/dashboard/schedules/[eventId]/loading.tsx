import { PageSkeleton } from "@components/shared/page-skeleton";

export default function ScheduleDetailLoading() {
  return (
    <PageSkeleton name="schedules-detail" loading>
      {null}
    </PageSkeleton>
  );
}
