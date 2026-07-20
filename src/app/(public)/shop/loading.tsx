import { PageSkeleton } from "@components/shared/page-skeleton";

export default function ShopLoading() {
  return (
    <PageSkeleton name="shop-public" loading>
      {null}
    </PageSkeleton>
  );
}
