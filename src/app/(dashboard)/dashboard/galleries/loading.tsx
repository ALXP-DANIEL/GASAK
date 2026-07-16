import { PageSkeleton } from "@components/shared/page-skeleton";

export default function GalleriesLoading() {
  return (
    <PageSkeleton name="galleries" loading>
      {null}
    </PageSkeleton>
  );
}
