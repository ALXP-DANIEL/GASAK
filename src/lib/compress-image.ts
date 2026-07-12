/**
 * Client-side image compression for upload fields. Phone photos are often
 * 3–8 MB; resizing + WebP encoding before upload cuts that ~50x, which is
 * the difference between a 20-second and a sub-second save on mobile.
 */

const COMPRESSIBLE = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function compressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.82,
): Promise<File> {
  // GIFs (animation) and unknown formats pass through untouched.
  if (!COMPRESSIBLE.has(file.type)) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      maxDimension / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    // Keep the original when compression doesn't actually help.
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, {
      type: "image/webp",
    });
  } catch {
    // Undecodable in this browser (e.g. HEIC) — let the server validate it.
    return file;
  }
}
