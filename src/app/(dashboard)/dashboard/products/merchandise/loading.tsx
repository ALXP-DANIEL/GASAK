import { PageSkeleton } from "@components/shared/page-skeleton";

export default function MerchandiseLoading() {
  return (
    <PageSkeleton name="merchandise" loading>
      {null}
    </PageSkeleton>
  );
}
