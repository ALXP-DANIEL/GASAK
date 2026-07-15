export type SiteConfig = {
  name: string;
  author: string;
  description: string;
  keywords: string[];
  url: {
    base: string;
    author: string;
  };
  links: {
    email: string;
    tiktok: string;
  };
  ogImage: string;
};
