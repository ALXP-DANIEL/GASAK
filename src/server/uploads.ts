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
