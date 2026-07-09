"use client";

import { DashboardForm } from "@components/forms/dashboard-form";
import { FormField, FormSelect } from "@components/forms/form-field";
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
import {
  createOrganizationPosition,
  updateOrganizationPosition,
} from "@server/actions/organization";
import type { OrganizationPosition } from "@server/db/schema";
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

  const { open, setOpen, control, pending, handleSubmit } =
    useEntityDialog<Values>({
      schema,
      defaultValues: {
        title: position?.title ?? "",
        icon: position?.icon ?? "",
        sortOrder: position?.sortOrder ?? 0,
        userId: position?.userId ?? UNASSIGNED,
        parentId: position?.parentId ?? NO_PARENT,
      },
      action: (values) => {
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
        return position
          ? updateOrganizationPosition(position.id, formData)
          : createOrganizationPosition(formData);
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
            New position
          </Button>
        )}
      </CredenzaTrigger>
      <CredenzaContent className="max-h-[85dvh] overflow-y-auto">
        <CredenzaHeader>
          <CredenzaTitle>{isEdit ? "Edit position" : "New position"}</CredenzaTitle>
          <CredenzaDescription>
            Manage the title, order, assigned profile, and hierarchy for this
            organization position.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="grid gap-4">
          <DashboardForm onSubmit={handleSubmit}>
            <FormField control={control} name="title" label="Title" />
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
              {pending
                ? "Saving..."
                : isEdit
                  ? "Save changes"
                  : "Create position"}
            </Button>
          </DashboardForm>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
