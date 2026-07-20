import { Skeleton } from "@components/ui/shadcn/skeleton";
import { DashboardHomeLoading } from "./_components/dashboard-bones";

/**
 * Instant navigation feedback for the dashboard home route. `DashboardHomeLoading`
 * plays back real bone positions captured from the live page (via `npx boneyard-js
 * build`) for the role layout the user last saw; `fallback` is the hand-drawn
 * placeholder shown on the first-ever visit or if bones haven't been captured yet.
 */
export default function DashboardLoading() {
  return <DashboardHomeLoading fallback={<StaticFallback />} />;
}

function StaticFallback() {
  return (
    <div className="flex flex-col gap-6">
      <div className="border-b pb-5">
        <div className="flex items-center gap-4">
          <Skeleton className="hidden size-12 desktop:block" />
          <div className="grid gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80 mobile:w-48" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 overflow-hidden border bg-card desktop:auto-cols-fr desktop:grid-flow-col">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
            key={index}
            className="-mt-px -ml-px grid gap-2 border-t border-l px-4 py-3.5"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 desktop:grid-cols-3">
        <div className="border bg-card desktop:col-span-2">
          <div className="border-b bg-muted/40 px-4 py-3">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid gap-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        </div>
        <div className="border bg-card">
          <div className="border-b bg-muted/40 px-4 py-3">
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="grid gap-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
