"use client";

import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@components/ui/credenza";
import { Badge } from "@components/ui/shadcn/badge";
import { Button } from "@components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/ui/shadcn/dialog";
import { Input } from "@components/ui/shadcn/input";
import { Label } from "@components/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/shadcn/select";
import { Separator } from "@components/ui/shadcn/separator";
import { Textarea } from "@components/ui/shadcn/textarea";
import { formatDateTime } from "@lib/format";
import {
  APPLICATION_STATUS_LABELS,
  formatLanes,
  SQUAD_ROLE_LABELS,
} from "@lib/labels";
import { formatRank } from "@lib/ranks";
import {
  assignApplication,
  onboardApplicant,
  updateApplicationStatus,
} from "@server/actions/recruitment";
import {
  type Application,
  type ApplicationStatus,
  type Squad,
  type SquadRole,
  squadRoleEnum,
} from "@server/db/schema";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { DetailRow } from "../../_components/page-surface";

export function ApplicationCard({
  application,
  assignedLeaderName,
  leaders,
  squads,
  isAdmin,
}: {
  application: Application & { squad?: Pick<Squad, "id" | "name"> | null };
  assignedLeaderName: string | null;
  leaders: { id: string; name: string }[];
  squads: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [leaderId, setLeaderId] = useState("");
  const [notes, setNotes] = useState(application.reviewNotes ?? "");
  const [squadId, setSquadId] = useState(squads[0]?.id ?? "");
  const [squadRole, setSquadRole] = useState<SquadRole>("player");
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [onboardEmail, setOnboardEmail] = useState(application.email);
  const [onboardPassword, setOnboardPassword] = useState("");
  const [credentials, setCredentials] = useState<{
    email: string;
    tempPassword: string;
  } | null>(null);
  // Card state follows the optimistic status so decisions feel instant;
  // it reverts automatically if the server action fails.
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    application.status,
  );

  const decided =
    optimisticStatus === "accepted" || optimisticStatus === "rejected";

  function setStatus(status: ApplicationStatus) {
    startTransition(async () => {
      setOptimisticStatus(status);
      const result = await updateApplicationStatus({
        applicationId: application.id,
        status,
        reviewNotes: notes || undefined,
      });

      if (result.ok) {
        toast.success(result.message);
        router.refresh();
        return;
      }

      toast.error(result.error);
    });
  }

  function assign() {
    startTransition(async () => {
      const result = await assignApplication(application.id, leaderId);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
        return;
      }

      toast.error(result.error);
    });
  }

  function onboard() {
    startTransition(async () => {
      const result = await onboardApplicant({
        applicationId: application.id,
        email: onboardEmail,
        squadId,
        squadRole,
        tempPassword: onboardPassword || undefined,
      });

      if (result.ok) {
        setOnboardOpen(false);
        setOnboardPassword("");
        toast.success(result.message);
        if (result.data) {
          setCredentials({
            email: result.data.email,
            tempPassword: result.data.tempPassword,
          });
        }
        router.refresh();
        return;
      }

      toast.error(result.error);
    });
  }

  function randomTempPassword() {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let password = "";
    for (let i = 0; i < 12; i++)
      password += chars[Math.floor(Math.random() * chars.length)];
    return password;
  }

  return (
    <>
      <Credenza>
        <CredenzaTrigger asChild>
          <button
            type="button"
            className="group w-full border bg-background p-3 text-left transition-colors hover:border-primary/60 hover:bg-primary/5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-heading text-base font-bold uppercase tracking-wide group-hover:text-primary">
                  {application.ign}
                </h3>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {application.fullName}
                </p>
              </div>
              <Badge
                variant={
                  optimisticStatus === "rejected"
                    ? "destructive"
                    : optimisticStatus === "accepted" ||
                        optimisticStatus === "trial"
                      ? "default"
                      : "outline"
                }
              >
                {APPLICATION_STATUS_LABELS[optimisticStatus]}
              </Badge>
            </div>

            <div className="mt-3 grid gap-1.5 text-xs text-muted-foreground">
              <p>
                {formatLanes(application.preferredLanes)} ·{" "}
                {formatRank(application.currentRank)}
              </p>
              <p className="truncate">
                Squad: {application.squad?.name ?? "No preference"}
              </p>
              <p>Applied {formatDateTime(application.createdAt)}</p>
            </div>
          </button>
        </CredenzaTrigger>
        <CredenzaContent className="max-h-[92dvh] desktop:max-h-[85dvh] desktop:max-w-3xl desktop:overflow-y-auto">
          <CredenzaHeader>
            <CredenzaTitle>{application.fullName}</CredenzaTitle>
            <CredenzaDescription>
              {`Application ${APPLICATION_STATUS_LABELS[optimisticStatus]}`}
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody className="grid gap-5">
            <div className="grid gap-3 rounded-none border bg-muted/10 p-4">
              <DetailRow label="IGN" value={application.ign} />
              <DetailRow
                label="MLBB ID"
                value={`${application.mlbbId} · Server ${application.serverId}`}
              />
              <DetailRow
                label="Preferred squad"
                value={application.squad?.name ?? "No preference"}
              />
              <DetailRow label="Email" value={application.email} />
              <DetailRow label="Phone" value={application.phone} />
              <DetailRow
                label="Lane"
                value={formatLanes(application.preferredLanes)}
              />
              <DetailRow
                label="Rank"
                value={formatRank(application.currentRank)}
              />
              <DetailRow label="Hero pool" value={application.heroPool} />
              <DetailRow
                label="Previous squad"
                value={application.previousTeam || "-"}
              />
              <Separator />
              <p className="text-sm leading-6 text-muted-foreground">
                {application.introduction}
              </p>
            </div>

            <div className="grid gap-3 rounded-none border bg-muted/10 p-4">
              <p className="text-sm text-muted-foreground">
                Assigned to:{" "}
                <span className="font-medium text-foreground">
                  {assignedLeaderName ?? "Unassigned"}
                </span>
              </p>

              <div className="flex flex-wrap gap-2">
                {!decided && (
                  <>
                    {optimisticStatus !== "trial" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={pending}
                        onClick={() => setStatus("trial")}
                      >
                        Move to trial
                      </Button>
                    )}
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => setStatus("accepted")}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={pending}
                      onClick={() => setStatus("rejected")}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>

              {isAdmin && !decided && (
                <div className="grid gap-2 border bg-background/60 p-3 desktop:grid-cols-[1fr_auto]">
                  <Select
                    value={leaderId}
                    onValueChange={(value) => setLeaderId(value ?? "")}
                  >
                    <SelectTrigger aria-label="Assign application to leader">
                      <SelectValue placeholder="Assign to leader..." />
                    </SelectTrigger>
                    <SelectContent>
                      {leaders.map((leader) => (
                        <SelectItem key={leader.id} value={leader.id}>
                          {leader.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending || !leaderId}
                    onClick={assign}
                  >
                    Assign
                  </Button>
                </div>
              )}

              {!decided && (
                <div className="grid gap-1">
                  <Label
                    htmlFor={`notes-${application.id}`}
                    className="text-xs"
                  >
                    Review notes
                  </Label>
                  <Textarea
                    id={`notes-${application.id}`}
                    rows={3}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </div>
              )}

              {decided && application.reviewNotes && (
                <p className="text-xs text-muted-foreground">
                  Notes: {application.reviewNotes}
                </p>
              )}

              {isAdmin && optimisticStatus === "accepted" && (
                <div className="grid gap-2 border bg-background/60 p-3">
                  <p className="text-sm font-medium">
                    Onboard: create account and squad slot
                  </p>
                  <p className="text-xs leading-6 text-muted-foreground">
                    Contact email is {application.email} — used only for
                    outreach. Set the login email and a temporary password
                    below.
                  </p>
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => setOnboardOpen(true)}
                  >
                    Onboard
                  </Button>
                </div>
              )}
            </div>
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>

      <Dialog
        open={credentials !== null}
        onOpenChange={(open) => !open && setCredentials(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account created</DialogTitle>
            <DialogDescription>
              Share these credentials with the player. This is the only time the
              password is shown.
            </DialogDescription>
          </DialogHeader>
          {credentials && (
            <div className="grid gap-2 border bg-muted/20 p-4 font-mono text-sm">
              <p>
                <span className="text-muted-foreground">Email: </span>
                {credentials.email}
              </p>
              <p>
                <span className="text-muted-foreground">Password: </span>
                {credentials.tempPassword}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={onboardOpen}
        onOpenChange={(open) => {
          setOnboardOpen(open);
          if (!open) setOnboardPassword("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Onboard {application.fullName}</DialogTitle>
            <DialogDescription>
              Set the login email and a temporary password for the new account.
              The application contact email ({application.email}) is used only
              for outreach and does not need to match.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor={`onboard-email-${application.id}`}>
                Login email
              </Label>
              <Input
                id={`onboard-email-${application.id}`}
                type="email"
                value={onboardEmail}
                onChange={(event) => setOnboardEmail(event.target.value)}
                placeholder={application.email}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`onboard-password-${application.id}`}>
                Temporary password
              </Label>
              <div className="flex gap-2">
                <Input
                  id={`onboard-password-${application.id}`}
                  value={onboardPassword}
                  onChange={(event) => setOnboardPassword(event.target.value)}
                  placeholder="Auto-generated if left blank"
                  className="font-mono"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setOnboardPassword(randomTempPassword())}
                >
                  Generate
                </Button>
              </div>
            </div>
            <div className="grid gap-2 desktop:grid-cols-[1fr_140px]">
              <Select
                value={squadId}
                onValueChange={(value) => setSquadId(value ?? "")}
              >
                <SelectTrigger aria-label="Onboard to squad">
                  <SelectValue placeholder="Pick a squad" />
                </SelectTrigger>
                <SelectContent>
                  {squads.map((squad) => (
                    <SelectItem key={squad.id} value={squad.id}>
                      {squad.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={squadRole}
                onValueChange={(value) => setSquadRole(value as SquadRole)}
              >
                <SelectTrigger aria-label="Onboard squad role">
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
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOnboardOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={pending || !squadId || !onboardEmail}
                onClick={onboard}
              >
                Create account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
