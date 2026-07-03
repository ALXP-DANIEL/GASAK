import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="bg-grid flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
      <Link href="/" className="flex items-center gap-2 text-foreground">
        <Lightning weight="fill" size={24} className="text-primary" />
        <span className="text-xl font-black uppercase italic tracking-wide">
          GASAK
        </span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
