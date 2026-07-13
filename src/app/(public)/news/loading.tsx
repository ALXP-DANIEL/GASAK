import { PageSkeleton } from "@components/shared/page-skeleton";

export default function NewsLoading() {
  return (
    <PageSkeleton name="news-public" loading>
      {null}
    </PageSkeleton>
  );
}
