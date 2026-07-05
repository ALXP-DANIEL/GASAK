type PagePlaceholderProps = {
  title: string;
  eyebrow: string;
  description: string;
};

export function PagePlaceholder({
  title,
  eyebrow,
  description,
}: PagePlaceholderProps) {
  return (
    <section className="mx-auto flex min-h-[60dvh] w-full max-w-5xl flex-col justify-center gap-4 px-4 py-16 desktop:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
        {eyebrow}
      </p>
      <div className="grid gap-3">
        <h1 className="font-heading text-3xl font-bold text-foreground desktop:text-5xl">
          {title}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          {description}
        </p>
      </div>
    </section>
  );
}
