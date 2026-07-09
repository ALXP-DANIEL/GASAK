"use client";

import {
  DashboardForm,
  DashboardFormGrid,
} from "@components/forms/dashboard-form";
import {
  FormCheckbox,
  FormField,
  FormFileInput,
} from "@components/forms/form-field";
import { Icons } from "@components/icons";
import { useEntityDialog } from "@components/shared/use-entity-dialog";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@components/ui/credenza";
import { Button } from "@components/ui/shadcn/button";
import { createAuthSlide, updateAuthSlide } from "@server/actions/auth-slides";
import type { AuthSlide } from "@server/db/schema";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(2, "Description is required"),
  eyebrow: z.string().min(2, "Eyebrow is required"),
  sortOrder: z.number("Enter a sort order").int(),
  image: z.instanceof(File).nullable(),
  active: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function AuthSlideFormDialog({ slide }: { slide?: AuthSlide }) {
  const isEdit = Boolean(slide);

  const { open, setOpen, control, pending, handleSubmit } =
    useEntityDialog<Values>({
      schema,
      defaultValues: {
        title: slide?.title ?? "",
        description: slide?.description ?? "",
        eyebrow: slide?.eyebrow ?? "GASAK Management",
        sortOrder: slide?.sortOrder ?? 0,
        image: null,
        active: slide?.active ?? true,
      },
      action: (values) => {
        const formData = new FormData();
        formData.set("title", values.title);
        formData.set("description", values.description);
        formData.set("eyebrow", values.eyebrow);
        formData.set("sortOrder", String(values.sortOrder));
        formData.set("active", values.active ? "on" : "off");
        if (values.image) formData.set("image", values.image);
        return slide
          ? updateAuthSlide(slide.id, formData)
          : createAuthSlide(formData);
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
            New slide
          </Button>
        )}
      </CredenzaTrigger>
      <CredenzaContent className="max-h-[85dvh] overflow-y-auto">
        <CredenzaHeader>
          <CredenzaTitle>{isEdit ? "Edit slide" : "New slide"}</CredenzaTitle>
          <CredenzaDescription>
            Manage the image and copy shown beside auth pages.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="grid gap-4">
          <DashboardForm onSubmit={handleSubmit}>
            <FormField control={control} name="eyebrow" label="Eyebrow" />
            <FormField control={control} name="title" label="Title" />
            <FormField
              control={control}
              name="description"
              label="Description"
              as="textarea"
              rows={3}
            />
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
                label={`Image ${slide?.imageUrl ? "(replace)" : ""}`}
                accept="image/*"
              />
            </DashboardFormGrid>
            <FormCheckbox
              control={control}
              name="active"
              label="Visible on auth pages"
            />
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : isEdit ? "Save changes" : "Create slide"}
            </Button>
          </DashboardForm>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
