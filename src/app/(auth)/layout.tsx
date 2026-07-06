import { Logo } from "@components/layout/logo";
import { AuthSideCarousel } from "@features/auth/components/auth-side-carousel";
import { listActiveAuthSlides } from "@features/auth-slides/queries";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const slides = await listActiveAuthSlides();

  return (
    <div className="grid min-h-svh bg-background text-foreground desktop:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 desktop:p-10">
        <div className="flex justify-center gap-2 desktop:justify-start">
          <Logo href="/" size={32} wordmark="compact" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>
      <div className="hidden desktop:block desktop:p-5">
        <AuthSideCarousel slides={slides} />
      </div>
    </div>
  );
}
