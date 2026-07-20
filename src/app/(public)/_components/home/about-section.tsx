import { Icons } from "@components/icons";
import Image from "next/image";
import Link from "next/link";

export function AboutSection() {
  return (
    <section id="about" className="relative overflow-hidden bg-background">
      <Image
        src="/images/about-family.png"
        alt=""
        fill
        className="object-cover"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-linear-to-br from-primary/15 via-background/90 to-background"
        aria-hidden="true"
      />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-14 desktop:px-8 desktop:py-24">
        <div className="mx-auto max-w-lg text-center desktop:mx-0 desktop:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            About GASAK
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold leading-tight tracking-wide desktop:text-4xl">
            More than a team,
            <br />
            <span className="text-primary">we are family.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground desktop:mx-0">
            GASAK ESPORT is built on passion, discipline, and brotherhood. We
            create champions both in-game and in life. Our mission is to
            represent Malaysia on the biggest stage.
          </p>
          <Link
            href="/about"
            className="mt-7 inline-flex items-center gap-2 rounded bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
          >
            Read more <Icons.Layout.Navigation.CaretRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
