import { PageSkeleton } from "@components/shared/page-skeleton";

export default function MatchesLoading() {
  return (
    <PageSkeleton name="matches" loading>
      {null}
    </PageSkeleton>
  );
}
