import { Skeleton } from "@components/ui/shadcn/skeleton";

/** Boundary for auth pages that read the session (e.g. change-password). */
export default function AuthLoading() {
  return (
    <div className="grid min-h-svh place-items-center p-4">
      <div className="grid w-full max-w-sm gap-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
