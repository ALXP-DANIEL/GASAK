import { PageSkeleton } from "@components/shared/page-skeleton";

export default function AboutLoading() {
  return (
    <PageSkeleton name="about" loading>
      {null}
    </PageSkeleton>
  );
}
