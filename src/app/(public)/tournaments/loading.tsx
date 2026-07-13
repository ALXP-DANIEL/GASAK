import { PageSkeleton } from "@components/shared/page-skeleton";

export default function TournamentsLoading() {
  return (
    <PageSkeleton name="tournaments-public" loading>
      {null}
    </PageSkeleton>
  );
}
