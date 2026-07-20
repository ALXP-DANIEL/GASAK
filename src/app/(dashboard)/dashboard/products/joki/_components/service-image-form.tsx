"use client";

import { FormFileInput } from "@components/forms/form-field";
import { BrandCard } from "@components/ui/brand";
import { Button } from "@components/ui/shadcn/button";
import { updateJokiServiceImage } from "@server/actions/joki";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function ServiceImageForm({
  mode,
  title,
  currentImageUrl,
}: {
  mode: "per_star" | "package";
  title: string;
  currentImageUrl: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Field name is mode-scoped so the two ServiceImageForm instances on this
  // page don't render duplicate DOM ids (FormFileInput derives id/htmlFor
  // straight from the field name) — duplicate ids broke label association
  // and caused the two upload widgets to visually collide.
  const fieldName = `image_${mode}` as const;
  const { control, handleSubmit, reset } = useForm<Record<string, File | null>>(
    { defaultValues: { [fieldName]: null } },
  );

  function onSubmit(values: Record<string, File | null>) {
    const image = values[fieldName];
    if (!image) {
      toast.error("Choose an image to upload");
      return;
    }
    const formData = new FormData();
    formData.set("image", image);
    startTransition(async () => {
      const result = await updateJokiServiceImage(mode, formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      reset({ [fieldName]: null });
      router.refresh();
    });
  }

  return (
    <BrandCard interactive={false} className="flex min-w-0 flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded border border-border bg-secondary">
          {currentImageUrl && (
            <Image
              src={currentImageUrl}
              alt={title}
              fill
              className="object-cover"
            />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">
            {currentImageUrl
              ? "Image set"
              : "No image yet — shows a fallback icon"}
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <FormFileInput
            control={control}
            name={fieldName}
            label="Replace image"
            hideLabel
            accept="image/*"
            cropConfig={{ aspect: 1, outputWidth: 1024, outputHeight: 1024 }}
          />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Uploading..." : "Upload"}
        </Button>
      </form>
    </BrandCard>
  );
}
