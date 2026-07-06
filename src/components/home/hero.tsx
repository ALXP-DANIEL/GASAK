import Link from "next/link";
import { Icons } from "@/components/icons";

export function Hero() {
  return (
    <section id="home" className="relative overflow-hidden bg-background">
      <div
        className="absolute inset-0 bg-linear-to-br from-primary/20 via-background to-background"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-background to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-14 desktop:px-8 desktop:py-40">
        <div className="flex flex-col items-center text-center desktop:hidden">
          <p className="font-heading text-3xl font-bold uppercase tracking-[0.15em] text-foreground">
            We are
          </p>
          <h1 className="mt-1 font-heading text-6xl font-bold leading-[0.95] tracking-wide text-primary">
            Gasak
            <br />
            Esport
          </h1>
          <p className="mt-3 font-heading text-xs font-bold uppercase tracking-[0.12em] text-primary">
            United as one. Dominate as GASAK.
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            GASAK ESPORT is a competitive esports organization focused on Mobile
            Legends: Bang Bang. Together we train, compete, and achieve
            greatness.
          </p>

          <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
            <Link
              href="/squads"
              className="relative flex items-center justify-center rounded-lg bg-primary px-5 py-3.5 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
            >
              Explore squads
              <Icons.Layout.Navigation.CaretRight
                size={16}
                weight="bold"
                className="absolute right-4"
              />
            </Link>
            <Link
              href="/recruitment"
              className="relative flex items-center justify-center rounded-lg border border-primary/50 px-5 py-3.5 text-sm font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-primary/10"
            >
              Join us
              <Icons.Layout.Navigation.CaretRight
                size={16}
                weight="bold"
                className="absolute right-4"
              />
            </Link>
          </div>
        </div>

        <div className="hidden max-w-xl desktop:block">
          <p className="font-heading text-3xl font-semibold uppercase tracking-wide text-foreground">
            We are
          </p>
          <h1 className="font-heading text-7xl font-bold leading-none tracking-wide text-primary">
            Gasak
            <br />
            Esport
          </h1>
          <p className="mt-4 font-heading text-base font-semibold uppercase tracking-widest text-primary">
            United as one. Dominate as GASAK.
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            GASAK ESPORT is a competitive esports organization focused on Mobile
            Legends: Bang Bang.
            <br />
            Together we train, compete, and achieve greatness.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/squads"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
            >
              Explore squads <Icons.Layout.Navigation.CaretRight size={14} />
            </Link>
            <Link
              href="/recruitment"
              className="inline-flex items-center gap-2 rounded-md border border-primary/50 bg-background/30 px-6 py-3 text-xs font-bold uppercase tracking-wider text-foreground backdrop-blur-sm transition-colors hover:bg-primary/10"
            >
              Join us <Icons.Layout.Navigation.CaretRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
