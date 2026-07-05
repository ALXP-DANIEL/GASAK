import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const headerActions = actions ?? children;

  return (
    <div className="mb-6 flex flex-col gap-4 desktop:flex-row desktop:items-start desktop:justify-between">
      <div className="grid gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-normal">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {headerActions && (
        <div className="flex flex-wrap gap-2">{headerActions}</div>
      )}
    </div>
  );
}

export function DashboardPanel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("shadow-xs", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-none border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
