import { Icons } from "@components/icons";
import { cn } from "@lib/utils";
import Link from "next/link";

/**
 * GASAK brand primitives — the homepage design language, reusable everywhere.
 *
 * Language: gold eyebrow labels, condensed (Oswald) uppercase headings,
 * gold-bordered cards that brighten on hover, and uppercase gold buttons.
 */

/** Gold eyebrow + condensed heading. Centered by default (homepage sections). */
export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div className={cn(centered && "text-center", className)}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "font-heading text-3xl font-bold tracking-wide lg:text-4xl",
          eyebrow && "mt-2",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground",
            centered && "mx-auto",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/** Page-level header for public pages — same language, rendered as h1. */
export function PageHero({
  eyebrow,
  title,
  description,
  align = "center",
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  children?: React.ReactNode;
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div className={cn(centered && "text-center", className)}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          {eyebrow}
        </p>
      )}
      <h1
        className={cn(
          "font-heading text-3xl font-bold tracking-wide lg:text-4xl",
          eyebrow && "mt-2",
        )}
      >
        {title}
      </h1>
      {description && (
        <p
          className={cn(
            "mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground",
            centered && "mx-auto",
          )}
        >
          {description}
        </p>
      )}
      {children && (
        <div className={cn("mt-5 flex gap-3", centered && "justify-center")}>
          {children}
        </div>
      )}
    </div>
  );
}

/** Gold-bordered panel that brightens on hover — the homepage card. */
export function BrandCard({
  className,
  interactive = true,
  ...props
}: React.ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-primary/25 bg-card",
        interactive && "transition-colors hover:border-primary/60",
        className,
      )}
      {...props}
    />
  );
}

export function BrandBadge({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded border border-primary/35 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary",
        className,
      )}
      {...props}
    />
  );
}

export function BrandFeatureCard({
  icon,
  title,
  description,
  footer,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <BrandCard className={cn("p-6 text-center md:text-left", className)}>
      <div className="flex flex-col items-center gap-3 md:items-start">
        {icon && <div className="text-primary">{icon}</div>}
        <h2 className="font-heading text-xl font-bold tracking-wide">
          {title}
        </h2>
      </div>
      {description && (
        <div className="mt-3 text-sm text-muted-foreground">{description}</div>
      )}
      {footer && <div className="mt-5">{footer}</div>}
    </BrandCard>
  );
}

const linkButtonVariants = {
  solid:
    "bg-primary text-primary-foreground transition-opacity hover:opacity-90",
  outline:
    "border border-primary/50 text-primary transition-colors hover:bg-primary/10",
} as const;

const linkButtonSizes = {
  sm: "px-4 py-1.5 text-[10px]",
  md: "px-6 py-2 text-xs",
  lg: "px-6 py-2.5 text-xs",
} as const;

/** Uppercase gold CTA link, with optional trailing caret. */
export function LinkButton({
  href,
  variant = "outline",
  size = "md",
  caret = false,
  external = false,
  className,
  children,
}: {
  href: string;
  variant?: keyof typeof linkButtonVariants;
  size?: keyof typeof linkButtonSizes;
  caret?: boolean;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const classes = cn(
    "inline-flex items-center justify-center gap-1.5 rounded font-semibold uppercase tracking-wider",
    linkButtonVariants[variant],
    linkButtonSizes[size],
    className,
  );

  const content = (
    <>
      {children}
      {caret && <Icons.Layout.Navigation.CaretRight size={13} />}
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}
