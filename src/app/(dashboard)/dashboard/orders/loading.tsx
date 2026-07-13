import { PageSkeleton } from "@components/shared/page-skeleton";

export default function OrdersLoading() {
  return (
    <PageSkeleton name="orders" loading>
      {null}
    </PageSkeleton>
  );
}
