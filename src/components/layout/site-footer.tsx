import { Icons } from "@components/icons";
import { ScrollTopButton } from "@components/ui/scroll-top-button";
import { siteConfig } from "@config/site";
import Link from "next/link";
import { Logo } from "./logo";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "Squads", href: "/squads" },
  { label: "Shop", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

const SUPPORT_LINKS = [
  { label: "FAQ", href: "/contact" },
  { label: "How to Order", href: "/pricing" },
  { label: "Payment Guide", href: "/pricing" },
  { label: "Terms of Service", href: "/contact" },
  { label: "Privacy Policy", href: "/contact" },
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
      {/* Mobile: compact brand + social row. Full link columns move to desktop. */}
      <div className="flex flex-col items-center gap-6 px-4 py-10 desktop:hidden">
        <Logo href={null} size={56} wordmark="full" />
        <ul className="flex items-center gap-5">
          {SOCIALS.map(({ Icon, label, href }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="flex items-center justify-center text-primary transition-opacity hover:opacity-80"
              >
                <Icon size={22} />
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto hidden w-full max-w-7xl gap-10 px-4 py-12 desktop:grid desktop:grid-cols-5 desktop:px-8">
        {/* Brand */}
        <div className="desktop:col-span-1">
          <Logo href={null} size={44} wordmark="full" />
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
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 desktop:px-8">
          <p className="text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} GASAK ESPORT. All Rights Reserved.
          </p>
          <ScrollTopButton />
        </div>
      </div>
    </footer>
  );
}
