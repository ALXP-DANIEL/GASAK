import { Skeleton } from "@components/ui/shadcn/skeleton";

/** Instant navigation feedback for public pages while server data loads. */
export default function PublicLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 desktop:px-6">
      <div className="grid gap-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-2/3 desktop:w-96" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="mt-10 grid gap-4 desktop:grid-cols-3">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
