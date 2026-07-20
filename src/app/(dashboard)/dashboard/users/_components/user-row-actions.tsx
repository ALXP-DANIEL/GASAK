"use client";

import { Icons } from "@components/icons";
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
import { Button } from "@components/ui/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/shadcn/select";
import { ORG_ROLE_LABELS } from "@lib/labels";
import {
  removeDashboardUser,
  setDashboardUserRole,
} from "@server/actions/users";
import { ORG_ROLES, type OrgRole } from "@server/db/schema";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { EditUserDialog } from "./users-table";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  personalEmail: string | null;
  role: string;
  ign: string | null;
  banned: boolean;
};

export function UserRoleSelect({
  user,
  isSelf,
}: {
  user: UserRow;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setRole(role: OrgRole) {
    startTransition(async () => {
      const result = await setDashboardUserRole({ userId: user.id, role });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <Select
      value={user.role}
      onValueChange={(value) => setRole(value as OrgRole)}
      disabled={pending || isSelf}
    >
      <SelectTrigger aria-label={`Role for ${user.name}`} className="w-32">
        <SelectValue>{(value: OrgRole) => ORG_ROLE_LABELS[value]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ORG_ROLES.map((item) => (
          <SelectItem key={item} value={item}>
            {ORG_ROLE_LABELS[item]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function UserRowActions({
  user,
  isSelf,
}: {
  user: UserRow;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function removeUser() {
    startTransition(async () => {
      const result = await removeDashboardUser(user.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <div className="flex justify-end gap-1">
      <EditUserDialog user={user} />
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              disabled={pending || isSelf}
              aria-label={`Delete ${user.name}`}
            >
              <Icons.Actions.Delete className="text-destructive" />
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {user.name}'s account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the account and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeUser} disabled={pending}>
              {pending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
