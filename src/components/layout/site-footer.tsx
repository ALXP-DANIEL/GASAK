import Image from "next/image";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { ScrollTopButton } from "@/components/ui/scroll-top-button";
import { siteConfig } from "@/config/site";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Squads", href: "/squads" },
  { label: "Players", href: "/players" },
  { label: "Recruitment", href: "/recruitment" },
  { label: "Shop", href: "/shop" },
  { label: "News", href: "/news" },
  { label: "Contact", href: "/contact" },
];

const SUPPORT_LINKS = [
  { label: "FAQ", href: "/contact" },
  { label: "How to Order", href: "/shop" },
  { label: "Payment Guide", href: "/shop" },
  { label: "Terms of Service", href: "/more" },
  { label: "Privacy Policy", href: "/more" },
];

const SOCIALS = [
  {
    Icon: Icons.Social.Facebook,
    label: "Facebook",
    href: siteConfig.links.instagram,
  },
  {
    Icon: Icons.Social.Instagram,
    label: "Instagram",
    href: siteConfig.links.instagram,
  },
  {
    Icon: Icons.Social.Youtube,
    label: "YouTube",
    href: siteConfig.links.instagram,
  },
  {
    Icon: Icons.Social.Tiktok,
    label: "TikTok",
    href: siteConfig.links.instagram,
  },
];

export function SiteFooter() {
  return (
    <footer id="contact" className="border-t border-primary/20 bg-background">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2">
            <Image
              src="/images/gasak-logo.png"
              alt="GASAK ESPORT logo"
              width={44}
              height={44}
              className="size-11 object-contain"
            />
            <span className="flex flex-col leading-none">
              <span className="font-heading text-lg font-bold uppercase tracking-widest text-primary">
                Gasak
              </span>
              <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
                Esport
              </span>
            </span>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            United as one.
            <br />
            Dominate as GASAK.
            <br />
            To be the best,
            <br />
            you must remain the best.
          </p>
        </div>

        <nav aria-label="Quick links">
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider">
            Quick Links
          </h3>
          <ul className="mt-4 flex flex-col gap-2">
            {QUICK_LINKS.map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Support links">
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider">
            Support
          </h3>
          <ul className="mt-4 flex flex-col gap-2">
            {SUPPORT_LINKS.map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider">
            Contact Us
          </h3>
          <ul className="mt-4 flex flex-col gap-3">
            <li className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icons.Contact.Email
                size={14}
                className="shrink-0 text-primary"
              />
              <a
                href={`mailto:${siteConfig.links.email}`}
                className="hover:text-primary"
              >
                {siteConfig.links.email}
              </a>
            </li>
            <li className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icons.Contact.Phone
                size={14}
                className="shrink-0 text-primary"
              />{" "}
              +60 12-345 6789
            </li>
            <li className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icons.Contact.Location
                size={14}
                className="shrink-0 text-primary"
              />{" "}
              Kuala Lumpur, Malaysia
            </li>
          </ul>
        </div>

        <nav aria-label="Follow us">
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider">
            Follow Us
          </h3>
          <ul className="mt-4 flex flex-col gap-3">
            {SOCIALS.map(({ Icon, label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon size={14} className="shrink-0 text-primary" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-primary/15">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          <span aria-hidden className="size-8 shrink-0" />
          <p className="flex-1 text-center text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} GASAK ESPORT. All Rights Reserved.
          </p>
          <ScrollTopButton />
        </div>
      </div>
    </footer>
  );
}
