"use client";

import { FormColorPicker } from "@components/forms/color-picker-field";
import { DashboardForm } from "@components/forms/dashboard-form";
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
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@components/ui/credenza";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@components/ui/shadcn/alert-dialog";
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
import { formatLanes, SQUAD_ROLE_LABELS } from "@lib/labels";
import {
  addSquadMember,
  deleteSquad,
  removeSquadMember,
  setSquadArchived,
  updateSquad,
  updateSquadMemberRole,
} from "@server/actions/squads";
import { type Lane, squadRoleEnum } from "@server/db/schema";
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
    profile: { ign: string | null; preferredLanes: Lane[] | null } | null;
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

const ACCENT_PRESETS = [
  { name: "Gold", color: "#d9a21b" },
  { name: "Blue", color: "#2f80ed" },
  { name: "Purple", color: "#8b5cf6" },
  { name: "Green", color: "#22c55e" },
  { name: "Crimson", color: "#ef4444" },
  { name: "Cyan", color: "#06b6d4" },
];

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
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        <Button variant="outline" className="w-full">
          <Icons.Actions.Edit />
          Edit squad
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Edit squad</CredenzaTitle>
          <CredenzaDescription>Update squad details.</CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="grid gap-4">
          <DashboardForm onSubmit={handleSubmit}>
            <FormField control={control} name="name" label="Squad name" />
            <FormField
              control={control}
              name="description"
              label="Description"
              as="textarea"
            />
            <FormColorPicker
              control={control}
              name="accentColor"
              label="Accent color"
              description="Pick the squad accent used across public squad surfaces."
              presets={ACCENT_PRESETS}
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
              cropConfig={{ aspect: 1, outputWidth: 512, outputHeight: 512 }}
            />
            <FormFileInput
              control={control}
              name="banner"
              label="Banner (replace)"
              accept="image/*"
              cropConfig={{
                aspect: 21 / 9,
                outputWidth: 1920,
                outputHeight: 823,
              }}
            />
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save changes"}
            </Button>
          </DashboardForm>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
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
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        <Button>
          <Icons.Actions.Add />
          Add member
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Add squad member</CredenzaTitle>
          <CredenzaDescription>
            Assign an existing user to this squad's roster.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="grid gap-4">
          <DashboardForm onSubmit={handleSubmit}>
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
          </DashboardForm>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
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

  function remove(memberId: string) {
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
              {formatLanes(member.user.profile?.preferredLanes)}
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
                  <SelectTrigger
                    aria-label={`Role for ${member.user.name}`}
                    className="w-28"
                  >
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
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={pending}
                        aria-label={`Remove ${member.user.name}`}
                      >
                        <Icons.Actions.Delete className="text-destructive" />
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Remove {member.user.name} from this squad?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        They will lose squad access but keep their account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={pending}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => remove(member.id)}
                        disabled={pending}
                      >
                        {pending ? "Removing..." : "Remove"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
