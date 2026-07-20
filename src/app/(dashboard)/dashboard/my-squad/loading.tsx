import { PageSkeleton } from "@components/shared/page-skeleton";

export default function MySquadLoading() {
  return (
    <PageSkeleton name="my-squad" loading>
      {null}
    </PageSkeleton>
  );
}
