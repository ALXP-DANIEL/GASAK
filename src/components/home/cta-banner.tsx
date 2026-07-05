import Image from "next/image";
import Link from "next/link";
import { Icons } from "@/components/icons";

export function CtaBanner() {
  return (
    <section id="join" className="mx-auto w-full max-w-7xl px-4 pb-14 lg:px-8">
      <div className="flex flex-col items-center gap-6 rounded-lg border border-primary/30 bg-card px-6 py-8 md:flex-row md:justify-between lg:px-10">
        <div className="flex flex-col items-center gap-5 md:flex-row">
          <Image
            src="/images/gasak-logo.png"
            alt=""
            width={80}
            height={80}
            className="size-20 object-contain"
          />
          <div className="text-center md:text-left">
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
