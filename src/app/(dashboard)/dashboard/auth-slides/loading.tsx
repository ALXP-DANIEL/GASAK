import { PageSkeleton } from "@components/shared/page-skeleton";

export default function AuthSlidesLoading() {
  return (
    <PageSkeleton name="auth-slides" loading>
      {null}
    </PageSkeleton>
  );
}
