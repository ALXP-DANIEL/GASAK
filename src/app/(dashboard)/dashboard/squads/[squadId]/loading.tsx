import { PageSkeleton } from "@components/shared/page-skeleton";

export default function SquadDetailLoading() {
  return (
    <PageSkeleton name="squads-detail" loading>
      {null}
    </PageSkeleton>
  );
}
