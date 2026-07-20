import { PageSkeleton } from "@components/shared/page-skeleton";

export default function MatchDetailLoading() {
  return (
    <PageSkeleton name="matches-detail" loading>
      {null}
    </PageSkeleton>
  );
}
