import { AccentTick } from "@app/(dashboard)/dashboard/_components/page-surface";

/**
 * Labeled group of fields inside a Credenza form body — an AccentTick-prefixed
 * heading (matching the dashboard HUD language) plus an optional description.
 * Stack multiple sections and the last one drops its bottom border/padding.
 */
export function FormSection({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-3.5 border-b border-border/60 pb-5 last:border-b-0 last:pb-0">
      <div className="grid gap-0.5">
        <h3 className="flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-normal">
          <AccentTick className="h-3 w-0.75" />
          {title}
        </h3>
        {description && (
          <p className="pl-3 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
