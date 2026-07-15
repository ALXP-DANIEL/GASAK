import { PageSkeleton } from "@components/shared/page-skeleton";

export default function JokiConfigLoading() {
  return (
    <PageSkeleton name="joki" loading>
      {null}
    </PageSkeleton>
  );
}
