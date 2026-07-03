"use client";

import { Trash } from "@phosphor-icons/react/dist/ssr/Trash";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { Label } from "@/components/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import { SQUAD_ROLE_LABELS } from "@/lib/labels";
import {
  addSquadMember,
  removeSquadMember,
  updateSquadMemberRole,
} from "@/server/actions/squads";
import { type SquadRole, squadRoleEnum } from "@/server/db/schema";

type MemberRow = {
  id: string;
  userId: string;
  squadRole: SquadRole;
  name: string;
  ign: string | null;
};

export function MembersManager({
  squadId,
  members,
  candidates,
}: {
  squadId: string;
  members: MemberRow[];
  candidates: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<SquadRole>("member");

  function run(
    action: () => Promise<{ ok: boolean } & Record<string, unknown>>,
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success((result as { message?: string }).message ?? "Done");
        router.refresh();
      } else {
        toast.error((result as { error?: string }).error ?? "Failed");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Roster</CardTitle>
        <CardDescription>
          Assign the leader, coach, members and reserves.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-3 rounded-lg border p-4">
          <p className="text-sm font-semibold">Assign user</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
            <div className="grid gap-1">
              <Label className="text-xs">User</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a user" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as SquadRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {squadRoleEnum.enumValues.map((r) => (
                    <SelectItem key={r} value={r}>
                      {SQUAD_ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                disabled={pending || !userId}
                onClick={() =>
                  run(() =>
                    addSquadMember({ squadId, userId, squadRole: role }),
                  )
                }
              >
                Add
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {member.ign ?? member.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {member.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={member.squadRole}
                  onValueChange={(v) =>
                    run(() => updateSquadMemberRole(member.id, v as SquadRole))
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {squadRoleEnum.enumValues.map((r) => (
                      <SelectItem key={r} value={r}>
                        {SQUAD_ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={pending}
                  onClick={() => run(() => removeSquadMember(member.id))}
                >
                  <Trash size={16} className="text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No members assigned yet.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
