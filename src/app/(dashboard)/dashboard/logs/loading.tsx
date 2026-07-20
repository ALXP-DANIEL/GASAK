import { PageSkeleton } from "@components/shared/page-skeleton";

export default function LogsLoading() {
  return (
    <PageSkeleton name="logs" loading>
      {null}
    </PageSkeleton>
  );
}
