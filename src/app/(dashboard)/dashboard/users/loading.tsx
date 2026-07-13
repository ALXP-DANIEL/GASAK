import { PageSkeleton } from "@components/shared/page-skeleton";

export default function UsersLoading() {
  return (
    <PageSkeleton name="users" loading>
      {null}
    </PageSkeleton>
  );
}
