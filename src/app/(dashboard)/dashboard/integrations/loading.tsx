import { PageSkeleton } from "@components/shared/page-skeleton";

export default function IntegrationsLoading() {
  return (
    <PageSkeleton name="integrations" loading>
      {null}
    </PageSkeleton>
  );
}
