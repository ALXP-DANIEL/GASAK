/** Pixel crop box reported by react-easy-crop's onCropComplete. */
export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Renders the selected crop box onto a canvas at the target output size and
 * encodes it as WebP. This is the only place pixels get resampled, so both
 * "crop to the right shape" and "compress before upload" happen in one pass.
 */
export async function cropImageToFile(
  imageUrl: string,
  crop: PixelCrop,
  outputWidth: number,
  outputHeight: number,
  fileName: string,
  quality = 0.85,
): Promise<File> {
  const image = await loadImage(imageUrl);

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not supported in this browser");

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
  if (!blob) throw new Error("Failed to encode cropped image");

  return new File([blob], `${fileName.replace(/\.[^.]+$/, "")}.webp`, {
    type: "image/webp",
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image"));
    image.src = src;
  });
}
