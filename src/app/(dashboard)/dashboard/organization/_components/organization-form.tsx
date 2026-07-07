"use client";

import { FormField, FormSelect } from "@components/forms/form-field";
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
import {
  createOrganizationPosition,
  updateOrganizationPosition,
} from "@server/actions/organization";
import type { OrganizationPosition } from "@server/db/schema";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  icon: z.string().optional(),
  sortOrder: z.number("Enter a sort order").int(),
  userId: z.string().optional(),
  parentId: z.string().optional(),
});

type Values = z.infer<typeof schema>;

const UNASSIGNED = "__unassigned__";
const NO_PARENT = "__no_parent__";

function collectDescendantIds(
  positionId: string,
  allPositions: { id: string; parentId: string | null }[],
) {
  const ids = new Set<string>();
  let frontier = [positionId];
  while (frontier.length > 0) {
    const children = allPositions
      .filter((p) => p.parentId && frontier.includes(p.parentId))
      .map((p) => p.id);
    for (const id of children) ids.add(id);
    frontier = children;
  }
  return ids;
}

export function OrganizationPositionFormDialog({
  position,
  candidateUsers,
  allPositions,
}: {
  position?: OrganizationPosition;
  candidateUsers: {
    id: string;
    name: string;
    email: string;
    organizationPositions: { id: string }[];
  }[];
  allPositions: { id: string; title: string; parentId: string | null }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(position);

  const availableUsers = candidateUsers.filter(
    (u) =>
      u.organizationPositions.length === 0 ||
      u.organizationPositions.some((p) => p.id === position?.id),
  );

  const excludedParentIds = position
    ? new Set([position.id, ...collectDescendantIds(position.id, allPositions)])
    : new Set<string>();
  const availableParents = allPositions.filter(
    (p) => !excludedParentIds.has(p.id),
  );

  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: position?.title ?? "",
      icon: position?.icon ?? "",
      sortOrder: position?.sortOrder ?? 0,
      userId: position?.userId ?? UNASSIGNED,
      parentId: position?.parentId ?? NO_PARENT,
    },
  });

  function onSubmit(values: Values) {
    const formData = new FormData();
    formData.set("title", values.title);
    formData.set("icon", values.icon ?? "");
    formData.set("sortOrder", String(values.sortOrder));
    if (values.userId && values.userId !== UNASSIGNED) {
      formData.set("userId", values.userId);
    }
    if (values.parentId && values.parentId !== NO_PARENT) {
      formData.set("parentId", values.parentId);
    }

    startTransition(async () => {
      const result = position
        ? await updateOrganizationPosition(position.id, formData)
        : await createOrganizationPosition(formData);

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
            New position
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit position" : "New position"}</DialogTitle>
          <DialogDescription>
            Manage the title, icon, order, and assigned user for this
            organization position.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <FormField control={control} name="title" label="Title" />
          <FormField
            control={control}
            name="icon"
            label="Icon (emoji, optional)"
          />
          <FormField
            control={control}
            name="sortOrder"
            label="Sort order"
            type="number"
          />
          <FormSelect
            control={control}
            name="userId"
            label="Assigned user"
            options={[
              { value: UNASSIGNED, label: "Vacant" },
              ...availableUsers.map((u) => ({
                value: u.id,
                label: `${u.name} (${u.email})`,
              })),
            ]}
          />
          <FormSelect
            control={control}
            name="parentId"
            label="Reports to"
            options={[
              { value: NO_PARENT, label: "Top of hierarchy" },
              ...availableParents.map((p) => ({
                value: p.id,
                label: p.title,
              })),
            ]}
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : isEdit ? "Save changes" : "Create position"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
