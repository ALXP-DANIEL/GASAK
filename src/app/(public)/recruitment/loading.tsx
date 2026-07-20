import { PageSkeleton } from "@components/shared/page-skeleton";

export default function RecruitmentLoading() {
  return (
    <PageSkeleton name="recruitment-public" loading>
      {null}
    </PageSkeleton>
  );
}
