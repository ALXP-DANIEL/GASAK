import { PageSkeleton } from "@components/shared/page-skeleton";

export default function PlayerDetailLoading() {
  return (
    <PageSkeleton name="players-detail" loading>
      {null}
    </PageSkeleton>
  );
}
