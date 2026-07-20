import { PageSkeleton } from "@components/shared/page-skeleton";

export default function PlayersLoading() {
  return (
    <PageSkeleton name="players" loading>
      {null}
    </PageSkeleton>
  );
}
