import type { SiteConfig } from "@apptypes/site";
import { env } from "@/env";

export const siteConfig: SiteConfig = {
  name: "GASAK",
  author: "ALXP-DANIEL",
  description:
    "GASAK Esports — Malaysian MLBB organization. Squads, recruitment, events, and shop in one portal.",
  keywords: [
    "GASAK",
    "esports",
    "MLBB",
    "Mobile Legends",
    "Malaysia",
    "recruitment",
    "joki rank boost",
    "merchandise",
  ],
  url: {
    base: env.NEXT_PUBLIC_SITE_URL,
    author: "https://alifdaniel.dpdns.org",
  },
  links: {
    email: "gasakesportofficial@gmail.com",
    tiktok: "https://www.tiktok.com/@gasak_esport",
  },
  ogImage: `${env.NEXT_PUBLIC_SITE_URL}/api/og`,
};
