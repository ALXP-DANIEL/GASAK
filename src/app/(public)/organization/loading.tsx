import { PageSkeleton } from "@components/shared/page-skeleton";

export default function OrganizationLoading() {
  return (
    <PageSkeleton name="organization-public" loading>
      {null}
    </PageSkeleton>
  );
}
