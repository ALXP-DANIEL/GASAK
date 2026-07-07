"use client";

import {
  FormField,
  FormFileInput,
  FormSelect,
  FormSwitch,
} from "@components/forms/form-field";
import { Icons } from "@components/icons";
import { DeleteButton } from "@components/shared/delete-button";
import { useEntityDialog } from "@components/shared/use-entity-dialog";
import {
  Diawer,
  DiawerBody,
  DiawerContent,
  DiawerDescription,
  DiawerHeader,
  DiawerTitle,
  DiawerTrigger,
} from "@components/ui/diawer";
import { Badge } from "@components/ui/shadcn/badge";
import { Button } from "@components/ui/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/shadcn/table";
import { LANE_LABELS, SQUAD_ROLE_LABELS } from "@lib/labels";
import {
  addSquadMember,
  deleteSquad,
  removeSquadMember,
  setSquadArchived,
  updateSquad,
  updateSquadMemberRole,
} from "@server/actions/squads";
import { squadRoleEnum } from "@server/db/schema";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { z } from "zod";

type SquadMemberRow = {
  id: string;
  userId: string;
  squadRole: (typeof squadRoleEnum.enumValues)[number];
  joinedAt: Date;
  user: {
    name: string;
    profile: { ign: string | null; preferredLane: string | null } | null;
  };
};

type SquadDetail = {
  id: string;
  name: string;
  description: string | null;
  accentColor: string | null;
  recruiting: boolean;
  archived: boolean;
  members: SquadMemberRow[];
};

const squadFormSchema = z.object({
  name: z.string().min(2, "Squad name is required"),
  description: z.string().optional(),
  accentColor: z.string().optional(),
  recruiting: z.boolean(),
  logo: z.instanceof(File).nullable(),
  banner: z.instanceof(File).nullable(),
});

export function SquadEditDialog({ squad }: { squad: SquadDetail }) {
  const { open, setOpen, control, pending, handleSubmit } = useEntityDialog({
    schema: squadFormSchema,
    defaultValues: {
      name: squad.name,
      description: squad.description ?? "",
      accentColor: squad.accentColor ?? "",
      recruiting: squad.recruiting,
      logo: null,
      banner: null,
    },
    action: (values) => {
      const formData = new FormData();
      formData.set("name", values.name);
      if (values.description) formData.set("description", values.description);
      if (values.accentColor) formData.set("accentColor", values.accentColor);
      formData.set("recruiting", String(values.recruiting));
      if (values.logo) formData.set("logo", values.logo);
      if (values.banner) formData.set("banner", values.banner);
      return updateSquad(squad.id, formData);
    },
  });

  return (
    <Diawer open={open} onOpenChange={setOpen}>
      <DiawerTrigger asChild>
        <Button variant="outline" className="w-full">
          <Icons.Actions.Edit />
          Edit squad
        </Button>
      </DiawerTrigger>
      <DiawerContent>
        <DiawerHeader>
          <DiawerTitle>Edit squad</DiawerTitle>
          <DiawerDescription>Update squad details.</DiawerDescription>
        </DiawerHeader>
        <DiawerBody className="grid gap-4">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <FormField control={control} name="name" label="Squad name" />
            <FormField
              control={control}
              name="description"
              label="Description"
              as="textarea"
            />
            <FormField
              control={control}
              name="accentColor"
              label="Accent color"
              placeholder="#d97b16"
            />
            <FormSwitch
              control={control}
              name="recruiting"
              label="Open for recruitment"
              description="Show this squad as an optional choice on the public recruitment form."
            />
            <FormFileInput
              control={control}
              name="logo"
              label="Logo (replace)"
              accept="image/*"
            />
            <FormFileInput
              control={control}
              name="banner"
              label="Banner (replace)"
              accept="image/*"
            />
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </DiawerBody>
      </DiawerContent>
    </Diawer>
  );
}

export function SquadArchiveButton({
  squadId,
  archived,
}: {
  squadId: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await setSquadArchived(squadId, !archived);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <Button
      variant="outline"
      className="w-full"
      disabled={pending}
      onClick={toggle}
    >
      {archived ? "Restore squad" : "Archive squad"}
    </Button>
  );
}

export function SquadDeleteButton({
  squadId,
  squadName,
}: {
  squadId: string;
  squadName: string;
}) {
  return (
    <DeleteButton
      action={deleteSquad.bind(null, squadId)}
      title="Delete squad?"
      description={`This will permanently remove "${squadName}" and its roster, scrims, tournaments, and news posts.`}
      redirectTo="/dashboard/squads"
    />
  );
}

const addMemberSchema = z.object({
  userId: z.string().min(1, "Pick a user"),
  squadRole: z.enum(squadRoleEnum.enumValues),
});

export function AddSquadMemberDialog({
  squadId,
  candidates,
}: {
  squadId: string;
  candidates: { id: string; name: string; email: string }[];
}) {
  const { open, setOpen, control, pending, handleSubmit } = useEntityDialog<
    z.infer<typeof addMemberSchema>
  >({
    schema: addMemberSchema,
    defaultValues: { userId: "", squadRole: "player" },
    action: (values) => addSquadMember({ squadId, ...values }),
  });

  return (
    <Diawer open={open} onOpenChange={setOpen}>
      <DiawerTrigger asChild>
        <Button>
          <Icons.Actions.Add />
          Add member
        </Button>
      </DiawerTrigger>
      <DiawerContent>
        <DiawerHeader>
          <DiawerTitle>Add squad member</DiawerTitle>
          <DiawerDescription>
            Assign an existing user to this squad's roster.
          </DiawerDescription>
        </DiawerHeader>
        <DiawerBody className="grid gap-4">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <FormSelect
              control={control}
              name="userId"
              label="User"
              placeholder="Pick a user"
              options={candidates.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.email})`,
              }))}
            />
            <FormSelect
              control={control}
              name="squadRole"
              label="Squad role"
              options={squadRoleEnum.enumValues.map((role) => ({
                value: role,
                label: SQUAD_ROLE_LABELS[role],
              }))}
            />
            <Button type="submit" disabled={pending}>
              {pending ? "Adding..." : "Add to squad"}
            </Button>
          </form>
        </DiawerBody>
      </DiawerContent>
    </Diawer>
  );
}

export function SquadRosterTable({
  members,
  canManage,
}: {
  members: SquadMemberRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setRole(memberId: string, squadRole: SquadMemberRow["squadRole"]) {
    startTransition(async () => {
      const result = await updateSquadMemberRole(memberId, squadRole);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  function remove(memberId: string, name: string) {
    if (!window.confirm(`Remove ${name} from this squad?`)) return;
    startTransition(async () => {
      const result = await removeSquadMember(memberId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  if (members.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No members in this squad yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Player</TableHead>
          <TableHead>IGN</TableHead>
          <TableHead>Lane</TableHead>
          <TableHead>Role</TableHead>
          {canManage && <TableHead />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell className="font-medium">{member.user.name}</TableCell>
            <TableCell>{member.user.profile?.ign ?? "—"}</TableCell>
            <TableCell>
              {member.user.profile?.preferredLane
                ? LANE_LABELS[
                    member.user.profile
                      .preferredLane as keyof typeof LANE_LABELS
                  ]
                : "—"}
            </TableCell>
            <TableCell>
              {canManage ? (
                <Select
                  value={member.squadRole}
                  onValueChange={(value) =>
                    setRole(member.id, value as SquadMemberRow["squadRole"])
                  }
                  disabled={pending}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {squadRoleEnum.enumValues.map((role) => (
                      <SelectItem key={role} value={role}>
                        {SQUAD_ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline">
                  {SQUAD_ROLE_LABELS[member.squadRole]}
                </Badge>
              )}
            </TableCell>
            {canManage && (
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={pending}
                  onClick={() => remove(member.id, member.user.name)}
                  aria-label={`Remove ${member.user.name}`}
                >
                  <Icons.Actions.Delete className="text-destructive" />
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
