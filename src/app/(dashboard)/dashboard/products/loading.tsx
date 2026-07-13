import { PageSkeleton } from "@components/shared/page-skeleton";

export default function ProductsLoading() {
  return (
    <PageSkeleton name="products" loading>
      {null}
    </PageSkeleton>
  );
}
