"use client";

import { DashboardFormGrid } from "@components/forms/dashboard-form";
import { FormCheckbox, FormFileInput } from "@components/forms/form-field";
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
import { createAuthImage, updateAuthImage } from "@server/actions/auth-images";
import type { AuthImage } from "@server/db/schema";
import { z } from "zod";

const schema = z.object({
  image: z.instanceof(File).nullable(),
  active: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function AuthImageFormDialog({ slide }: { slide?: AuthImage }) {
  const isEdit = Boolean(slide);

  const { open, setOpen, control, pending, handleSubmit } =
    useEntityDialog<Values>({
      schema,
      defaultValues: {
        image: null,
        active: slide?.active ?? true,
      },
      action: (values) => {
        const formData = new FormData();
        formData.set("active", values.active ? "on" : "off");
        if (values.image) formData.set("image", values.image);
        return slide
          ? updateAuthImage(slide.id, formData)
          : createAuthImage(formData);
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
            Manage the image shown in the auth-side background grid.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            id="auth-slide-form"
            onSubmit={handleSubmit}
            className="grid gap-5"
          >
            <FormSection title="Display">
              <DashboardFormGrid>
                <FormFileInput
                  control={control}
                  name="image"
                  label={`Image ${slide?.imageUrl ? "(replace)" : ""}`}
                  accept="image/*"
                  cropConfig={{
                    aspect: 1,
                    outputWidth: 1024,
                    outputHeight: 1024,
                  }}
                />
              </DashboardFormGrid>
              <FormCheckbox
                control={control}
                name="active"
                label="Visible on auth pages"
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
          <Button type="submit" form="auth-slide-form" disabled={pending}>
            {pending ? "Saving..." : isEdit ? "Save changes" : "Create image"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
