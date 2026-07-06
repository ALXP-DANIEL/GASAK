"use client";

import {
  FormCheckbox,
  FormField,
  FormFileInput,
} from "@components/forms/form-field";
import { Icons } from "@components/icons";
import { Button } from "@components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/shadcn/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAuthSlide, updateAuthSlide } from "@server/actions/auth-slides";
import type { AuthSlide } from "@server/db/schema";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(slide);

  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: slide?.title ?? "",
      description: slide?.description ?? "",
      eyebrow: slide?.eyebrow ?? "GASAK Management",
      sortOrder: slide?.sortOrder ?? 0,
      image: null,
      active: slide?.active ?? true,
    },
  });

  function onSubmit(values: Values) {
    const formData = new FormData();
    formData.set("title", values.title);
    formData.set("description", values.description);
    formData.set("eyebrow", values.eyebrow);
    formData.set("sortOrder", String(values.sortOrder));
    formData.set("active", values.active ? "on" : "off");
    if (values.image) formData.set("image", values.image);

    startTransition(async () => {
      const result = slide
        ? await updateAuthSlide(slide.id, formData)
        : await createAuthSlide(formData);

      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
        return;
      }

      toast.error(result.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
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
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit slide" : "New slide"}</DialogTitle>
          <DialogDescription>
            Manage the image and copy shown beside auth pages.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <FormField control={control} name="eyebrow" label="Eyebrow" />
          <FormField control={control} name="title" label="Title" />
          <FormField
            control={control}
            name="description"
            label="Description"
            as="textarea"
            rows={3}
          />
          <div className="grid gap-4 desktop:grid-cols-2">
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
          </div>
          <FormCheckbox
            control={control}
            name="active"
            label="Visible on auth pages"
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : isEdit ? "Save changes" : "Create slide"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
