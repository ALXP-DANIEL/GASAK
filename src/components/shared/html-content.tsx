import { cn } from "@lib/utils";
import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = sanitizeHtml.defaults.allowedTags.concat([
  "img",
  "h1",
  "h2",
  "h3",
  "u",
  "s",
]);

/** Renders admin-authored rich text (news posts) — sanitized against XSS. */
export function HtmlContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const clean = sanitizeHtml(content, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title"],
      a: ["href", "name", "target", "rel"],
    },
  });

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none prose-headings:font-heading prose-a:text-primary",
        className,
      )}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized above via sanitize-html
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
