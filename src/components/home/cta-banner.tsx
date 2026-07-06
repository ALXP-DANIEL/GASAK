import { Icons } from "@components/icons";
import { Logo } from "@components/layout/logo";
import Link from "next/link";

export function CtaBanner() {
  return (
    <section
      id="join"
      className="mx-auto w-full max-w-7xl px-4 pb-14 desktop:px-8"
    >
      <div className="flex flex-col items-center gap-6 rounded-lg border border-primary/30 bg-card px-6 py-8 desktop:flex-row desktop:justify-between desktop:px-10">
        <div className="flex flex-col items-center gap-5 desktop:flex-row">
          <Logo href={null} size={80} wordmark="none" />
          <div className="text-center desktop:text-left">
            <h2 className="font-heading leading-tight tracking-wide">
              <span className="block text-xl font-semibold uppercase">
                Ready to be part of
              </span>
              <span className="block text-2xl font-bold uppercase text-primary">
                The movement?
              </span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Join GASAK ESPORT and start your journey with us today!
            </p>
          </div>
        </div>
        <Link
          href="/recruitment"
          className="inline-flex shrink-0 items-center gap-2 rounded bg-primary px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
        >
          Apply now <Icons.Layout.Navigation.CaretRight size={14} />
        </Link>
      </div>
    </section>
  );
}
