import { PageSkeleton } from "@components/shared/page-skeleton";

export default function ShopDetailLoading() {
  return (
    <PageSkeleton name="shop-public-detail" loading>
      {null}
    </PageSkeleton>
  );
}
