import { PageSkeleton } from "@components/shared/page-skeleton";

export default function NewsDetailLoading() {
  return (
    <PageSkeleton name="news-detail" loading>
      {null}
    </PageSkeleton>
  );
}
