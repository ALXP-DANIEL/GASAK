"use client";

import { DashboardFormGrid } from "@components/forms/dashboard-form";
import {
  FormCheckbox,
  FormField,
  FormFileInput,
} from "@components/forms/form-field";
import { FormSection } from "@components/forms/form-section";
import { Icons } from "@components/icons";
import { useEntityDialog } from "@components/shared/use-entity-dialog";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@components/ui/credenza";
import { Button } from "@components/ui/shadcn/button";
import {
  createGalleryImage,
  updateGalleryImage,
} from "@server/actions/galleries";
import type { Gallery } from "@server/db/schema";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  sortOrder: z.number("Enter a sort order").int(),
  image: z.instanceof(File).nullable(),
  active: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function GalleryFormDialog({ image }: { image?: Gallery }) {
  const isEdit = Boolean(image);

  const { open, setOpen, control, pending, handleSubmit } =
    useEntityDialog<Values>({
      schema,
      defaultValues: {
        title: image?.title ?? "",
        description: image?.description ?? "",
        sortOrder: image?.sortOrder ?? 0,
        image: null,
        active: image?.active ?? true,
      },
      action: (values) => {
        const formData = new FormData();
        formData.set("title", values.title);
        formData.set("description", values.description ?? "");
        formData.set("sortOrder", String(values.sortOrder));
        formData.set("active", values.active ? "on" : "off");
        if (values.image) formData.set("image", values.image);
        return image
          ? updateGalleryImage(image.id, formData)
          : createGalleryImage(formData);
      },
    });

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        {isEdit ? (
          <Button variant="outline" size="sm">
            Edit
          </Button>
        ) : (
          <Button>
            <Icons.Actions.Add />
            New image
          </Button>
        )}
      </CredenzaTrigger>
      <CredenzaContent className="max-h-[85dvh] overflow-y-auto">
        <CredenzaHeader>
          <CredenzaTitle>{isEdit ? "Edit image" : "New image"}</CredenzaTitle>
          <CredenzaDescription>
            Manage the image and caption shown in the public gallery.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            id="gallery-form"
            onSubmit={handleSubmit}
            className="grid gap-5"
          >
            <FormSection title="Copy">
              <FormField control={control} name="title" label="Title" />
              <FormField
                control={control}
                name="description"
                label="Description"
                as="textarea"
                rows={3}
              />
            </FormSection>
            <FormSection title="Display">
              <DashboardFormGrid>
                <FormField
                  control={control}
                  name="sortOrder"
                  label="Sort order"
                  type="number"
                />
                <FormFileInput
                  control={control}
                  name="image"
                  label={`Image ${image?.imageUrl ? "(replace)" : ""}`}
                  accept="image/*"
                />
              </DashboardFormGrid>
              <FormCheckbox
                control={control}
                name="active"
                label="Visible on the public gallery"
              />
            </FormSection>
          </form>
        </CredenzaBody>
        <CredenzaFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="gallery-form" disabled={pending}>
            {pending ? "Saving..." : isEdit ? "Save changes" : "Create image"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
