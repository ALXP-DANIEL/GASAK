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
    "diamonds top-up",
  ],
  url: {
    base: env.NEXT_PUBLIC_SITE_URL,
    author: "https://alifdaniel.dpdns.org",
  },
  links: {
    github: "https://github.com/ALXP-DANIEL",
    instagram: "https://www.instagram.com/thealifhaker1/",
    linkedin: "https://www.linkedin.com/in/thealifhaker1",
    email: "alifdaniel.workspace@gmail.com",
  },
  ogImage: `${env.NEXT_PUBLIC_SITE_URL}/api/og`,
};
