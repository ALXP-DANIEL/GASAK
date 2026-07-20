import { PageSkeleton } from "@components/shared/page-skeleton";

export default function ShopOrderLoading() {
  return (
    <PageSkeleton name="shop-order" loading>
      {null}
    </PageSkeleton>
  );
}
