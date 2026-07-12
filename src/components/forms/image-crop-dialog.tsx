"use client";

import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@components/ui/credenza";
import { Button } from "@components/ui/shadcn/button";
import { Slider } from "@components/ui/shadcn/slider";
import { cropImageToFile, type PixelCrop } from "@lib/crop-image";
import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

export type ImageCropConfig = {
  /** width / height, e.g. 1 for square, 16/9 for wide banners. */
  aspect: number;
  outputWidth: number;
  outputHeight: number;
  cropShape?: "rect" | "round";
};

/**
 * Crop step shown right after picking a file, before it ever reaches the
 * form or upload. Every field that embeds this gets the exact same output
 * dimensions, so avatars, logos, banners, etc. are pixel-consistent across
 * the whole app regardless of what the user originally selected.
 */
export function ImageCropDialog({
  open,
  imageUrl,
  fileName,
  config,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  imageUrl: string | null;
  fileName: string;
  config: ImageCropConfig;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(
    null,
  );
  const [pending, setPending] = useState(false);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixelsValue: Area) => {
      setCroppedAreaPixels(croppedAreaPixelsValue);
    },
    [],
  );

  function reset() {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }

  async function handleConfirm() {
    if (!imageUrl || !croppedAreaPixels) return;
    setPending(true);
    try {
      const file = await cropImageToFile(
        imageUrl,
        croppedAreaPixels,
        config.outputWidth,
        config.outputHeight,
        fileName,
      );
      onConfirm(file);
      reset();
    } finally {
      setPending(false);
    }
  }

  return (
    <Credenza
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
          onCancel();
        }
      }}
    >
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Crop image</CredenzaTitle>
        </CredenzaHeader>
        <CredenzaBody className="grid gap-4">
          <div className="relative h-72 w-full overflow-hidden bg-muted desktop:h-96">
            {imageUrl && (
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                aspect={config.aspect}
                cropShape={config.cropShape ?? "rect"}
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Zoom</span>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.05}
              onValueChange={(value) =>
                setZoom(Array.isArray(value) ? value[0] : value)
              }
              className="flex-1"
            />
          </div>
        </CredenzaBody>
        <CredenzaFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset();
              onCancel();
            }}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={pending || !croppedAreaPixels}
          >
            {pending ? "Applying..." : "Apply crop"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
