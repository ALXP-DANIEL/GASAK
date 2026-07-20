import { Logo } from "@components/layout/logo";
import { AuthSideGrid } from "@features/auth/components/auth-side-grid";
import { listActiveAuthImages } from "@features/auth-images/queries";
import { cn } from "@lib/utils";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const slides = await listActiveAuthImages();

  return (
    <div
      className={cn(
        "relative grid min-h-svh grid-cols-1 bg-background text-foreground",
      )}
    >
      <AuthSideGrid slides={slides} />

      <div className="relative z-10 flex flex-col gap-4 p-6 desktop:p-10">
        <div className="flex justify-center gap-2 desktop:justify-start">
          <Logo href="/" size={32} wordmark="compact" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>
    </div>
  );
}
