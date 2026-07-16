import "server-only";

import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/**
 * Uploads an image to UploadThing and returns its public URL.
 */
export async function saveUpload(
  file: File,
  folder:
    | "squads"
    | "avatars"
    | "products"
    | "tournaments"
    | "auth-slides"
    | "news"
    | "joki"
    | "galleries",
): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Only JPEG, PNG, WebP or GIF images are allowed");
  }
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Image exceeds 4 MB limit");

  const renamed = new File([file], `${folder}-${crypto.randomUUID()}`, {
    type: file.type,
  });

  const result = await utapi.uploadFiles(renamed);
  if (result.error) throw new Error(result.error.message);

  return result.data.ufsUrl;
}

/**
 * Best-effort removal of an UploadThing-hosted file when its DB row is
 * deleted or its image replaced, so storage doesn't accumulate orphans.
 * Non-UploadThing URLs (seed images under /images, external placeholders)
 * are ignored. Never throws — losing a cleanup is preferable to failing
 * the user's action after the DB write succeeded.
 */
export async function deleteUpload(
  url: string | null | undefined,
): Promise<void> {
  if (!url) return;
  let key: string | null = null;
  try {
    const parsed = new URL(url);
    const isUploadThing =
      parsed.hostname === "utfs.io" || parsed.hostname.endsWith(".ufs.sh");
    // Both hosts serve files at /f/<fileKey>.
    const match = parsed.pathname.match(/^\/f\/([^/]+)$/);
    if (isUploadThing && match) key = match[1];
  } catch {
    return; // relative or malformed URL — nothing hosted to delete
  }
  if (!key) return;

  try {
    await utapi.deleteFiles(key);
  } catch (err) {
    console.warn(`[uploads] failed to delete file ${key}:`, err);
  }
}
