import { PageSkeleton } from "@components/shared/page-skeleton";

export default function OrganizationLoading() {
  return (
    <PageSkeleton name="organization" loading>
      {null}
    </PageSkeleton>
  );
}
