import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Oswald } from "next/font/google";
import "@styles/globals.css";
import SplashGate from "@components/layout/splash-gate";
import { Toaster } from "@components/ui/shadcn/sonner";
import { TooltipProvider } from "@components/ui/shadcn/tooltip";
import { siteConfig } from "@config/site";
import { cn } from "@lib/utils";
import { env } from "@/env";
import Maintenance from "./maintenance";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url.base),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: siteConfig.keywords,
  authors: [
    {
      name: siteConfig.author,
      //  url: siteConfig.links.github
    },
  ],
  creator: siteConfig.author,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  other: {
    // "github:repo": siteConfig.links.github,
  },
};

const isMaintenance = env.IS_MAINTENANCE === "true";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "dark h-full antialiased font-sans",
        inter.variable,
        jetbrainsMono.variable,
        oswald.variable,
      )}
    >
      <body className="min-h-full font-sans">
        {isMaintenance ? (
          <Maintenance />
        ) : (
          <SplashGate>
            <TooltipProvider>{children}</TooltipProvider>
          </SplashGate>
        )}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
