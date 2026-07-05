import Image from "next/image";
import Link from "next/link";
import { Icons } from "@/components/icons";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid min-h-svh bg-background text-foreground desktop:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 desktop:p-10">
        <div className="flex justify-center gap-2 desktop:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Icons.Domain.Lightning size={16} weight="fill" />
            </div>
            GASAK Management
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>
      <div className="relative hidden bg-muted desktop:block">
        <Image
          src="/images/hero.png"
          alt="GASAK esports team"
          fill
          priority
          sizes="50vw"
          className="object-cover dark:brightness-[0.35] dark:grayscale"
        />
      </div>
    </div>
  );
}
