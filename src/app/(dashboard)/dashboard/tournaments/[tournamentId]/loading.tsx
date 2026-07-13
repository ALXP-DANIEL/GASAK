import { PageSkeleton } from "@components/shared/page-skeleton";

export default function TournamentDetailLoading() {
  return (
    <PageSkeleton name="tournaments-detail" loading>
      {null}
    </PageSkeleton>
  );
}
