import { PageSkeleton } from "@components/shared/page-skeleton";

export default function ContactLoading() {
  return (
    <PageSkeleton name="contact" loading>
      {null}
    </PageSkeleton>
  );
}
