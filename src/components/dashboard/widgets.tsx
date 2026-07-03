import type { Icon } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/shadcn/card";

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <span className="stripe mb-2" />
        <h1 className="text-2xl font-black lg:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  Icon: StatIcon,
  hint,
}: {
  label: string;
  value: string | number;
  Icon: Icon;
  hint?: string;
}) {
  return (
    <Card className="corner-cut">
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="corner-cut bg-primary/12 p-2.5 text-primary">
          <StatIcon size={22} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-2xl font-bold">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          {hint && (
            <p className="truncate text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
