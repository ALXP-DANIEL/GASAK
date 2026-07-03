import Link from "next/link";
import { Nav } from "@/components/layouts/nav";
import { siteConfig } from "@/config/site";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-6xl px-4 pt-[max(4rem,env(safe-area-inset-top))] pb-32 lg:px-8 lg:pt-28 lg:pb-16">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-6xl px-4 pb-36 text-sm text-muted-foreground lg:px-8 lg:pb-10">
        <div className="flex flex-col items-center justify-between gap-2 border-t pt-6 lg:flex-row">
          <p>
            © {new Date().getFullYear()} {siteConfig.name} Esports. All rights
            reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-foreground">
              About
            </Link>
            <Link href="/recruitment" className="hover:text-foreground">
              Recruitment
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              Contact
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
