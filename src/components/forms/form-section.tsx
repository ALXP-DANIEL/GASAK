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

/**
 * Numbered intake-form section — a two-column "01 / Title / description"
 * sidebar beside the fields, matching the recruitment application form.
 * Heavier than {@link FormSection}; use for standalone public-facing forms
 * (multi-section checkouts, applications), not compact dashboard dialogs.
 */
export function IndexedFormSection({
  index,
  title,
  description,
  children,
}: {
  index: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-5 border-t border-border p-6 first:border-t-0 desktop:grid-cols-[10rem_minmax(0,1fr)]">
      <div>
        <p className="font-mono text-xs text-primary">{index}</p>
        <h3 className="mt-2 font-heading text-xl font-bold uppercase tracking-wide">
          {title}
        </h3>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
