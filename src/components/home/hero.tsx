import Link from "next/link";
import { Icons } from "@/components/icons";
import { Logo } from "@/components/layout/logo";

export function Hero() {
  return (
    <section id="home" className="relative overflow-hidden">
      {/* Placeholder backdrop until hero artwork is ready — swap for the
          real image later without touching layout/copy below. */}
      <div
        className="absolute inset-0 bg-linear-to-br from-primary/20 via-background to-background"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-16 text-center desktop:px-8 desktop:py-32">
        <Logo size={72} wordmark="none" />
        <p className="mt-6 font-heading text-3xl font-bold uppercase tracking-[0.15em] text-foreground desktop:text-4xl">
          We are
        </p>
        <h1 className="mt-1 font-heading text-6xl font-bold leading-[0.95] tracking-wide text-primary desktop:text-7xl">
          Gasak
          <br />
          Esport
        </h1>
        <p className="mt-3 font-heading text-xs font-bold uppercase tracking-[0.12em] text-primary desktop:text-base desktop:tracking-widest">
          United as one. Dominate as GASAK.
        </p>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          GASAK ESPORT is a competitive esports organization focused on Mobile
          Legends: Bang Bang. Together we train, compete, and achieve greatness.
        </p>

        <div className="mt-8 flex w-full max-w-sm flex-col gap-3 desktop:w-auto desktop:flex-row desktop:flex-wrap desktop:justify-center">
          <Link
            href="/squads"
            className="relative flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 desktop:rounded-md desktop:py-3 desktop:text-xs"
          >
            Explore squads
            <Icons.Layout.Navigation.CaretRight size={14} weight="bold" />
          </Link>
          <Link
            href="/recruitment"
            className="relative flex items-center justify-center gap-2 rounded-lg border border-primary/50 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-primary/10 desktop:rounded-md desktop:py-3 desktop:text-xs"
          >
            Join us
            <Icons.Layout.Navigation.CaretRight size={14} weight="bold" />
          </Link>
        </div>
      </div>
    </section>
  );
}
