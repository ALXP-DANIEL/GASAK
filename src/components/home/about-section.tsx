import Image from "next/image";
import Link from "next/link";
import { Icons } from "@/components/icons";

export function AboutSection() {
  return (
    <section id="about" className="relative overflow-hidden lg:min-h-128">
      <div className="relative aspect-4/5 w-full sm:aspect-video lg:absolute lg:inset-0 lg:aspect-auto lg:h-full">
        <Image
          src="/images/about-family.png"
          alt="GASAK ESPORT team members overlooking a city skyline at night with the golden shark emblem glowing above"
          fill
          className="object-cover object-right lg:object-[center_30%]"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-linear-to-t from-black/90 via-black/55 to-black/10 lg:bg-linear-to-r"
          aria-hidden="true"
        />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-8 lg:absolute lg:inset-0 lg:flex lg:items-center lg:px-8 lg:py-24 lg:pb-24">
        <div className="max-w-lg text-center text-white lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            About GASAK
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold leading-tight tracking-wide lg:text-4xl">
            More than a team,
            <br />
            <span className="text-primary">we are family.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/80 lg:mx-0">
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
