import { PageSkeleton } from "@components/shared/page-skeleton";

export default function SquadsLoading() {
  return (
    <PageSkeleton name="squads" loading>
      {null}
    </PageSkeleton>
  );
}
