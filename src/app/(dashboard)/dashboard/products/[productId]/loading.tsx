import { PageSkeleton } from "@components/shared/page-skeleton";

export default function ProductDetailLoading() {
  return (
    <PageSkeleton name="products-detail" loading>
      {null}
    </PageSkeleton>
  );
}
