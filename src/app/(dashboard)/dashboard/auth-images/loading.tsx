import { PageSkeleton } from "@components/shared/page-skeleton";

export default function AuthImagesLoading() {
  return (
    <PageSkeleton name="auth-images" loading>
      {null}
    </PageSkeleton>
  );
}
