import { siteConfig } from "@config/site";
import type { Metadata } from "next";

type PageMetadataInput = {
  description?: string;
  path: string;
  title: string;
  type?: string;
  /** Absolute or site-relative image to feature, such as squad logo or product photo. */
  image?: string | null;
  /** Hex accent color for the OG card. */
  accent?: string | null;
  /** Short context line rendered under the title. */
  meta?: string | null;
};

function absoluteUrl(path: string) {
  return new URL(path, siteConfig.url.base).toString();
}

function ogImageUrl({
  path,
  title,
  type,
  image,
  accent,
  meta,
}: PageMetadataInput) {
  const url = new URL("/api/og", siteConfig.url.base);

  url.searchParams.set("title", title);
  url.searchParams.set("type", type ?? "Page");
  url.searchParams.set("link", absoluteUrl(path));

  if (image) {
    url.searchParams.set("image", absoluteUrl(image));
  }

  if (accent) {
    url.searchParams.set("accent", accent);
  }

  if (meta) {
    url.searchParams.set("meta", meta);
  }

  return url.toString();
}

export function createPageMetadata({
  description = siteConfig.description,
  path,
  title,
  type,
  image,
  accent,
  meta,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const ogImage = ogImageUrl({
    path,
    title,
    type,
    image,
    accent,
    meta,
  });

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      url,
      siteName: siteConfig.name,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${title} | ${siteConfig.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
