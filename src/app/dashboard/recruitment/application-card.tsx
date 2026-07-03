"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/shadcn/dialog";
import { Label } from "@/components/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import { Separator } from "@/components/ui/shadcn/separator";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { formatDateTime } from "@/lib/format";
import {
  APPLICATION_STATUS_LABELS,
  LANE_LABELS,
  SQUAD_ROLE_LABELS,
} from "@/lib/labels";
import {
  assignApplication,
  onboardApplicant,
  updateApplicationStatus,
} from "@/server/actions/recruitment";
import {
  type Application,
  type ApplicationStatus,
  type SquadRole,
  squadRoleEnum,
} from "@/server/db/schema";

const STATUS_VARIANTS: Record<
  ApplicationStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  applied: "outline",
  under_review: "secondary",
  trial: "default",
  accepted: "default",
  rejected: "destructive",
};

export function ApplicationCard({
  application,
  assignedLeaderName,
  leaders,
  squads,
  isAdmin,
}: {
  application: Application;
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
  const [squadRole, setSquadRole] = useState<SquadRole>("member");
  const [credentials, setCredentials] = useState<{
    email: string;
    tempPassword: string;
  } | null>(null);

  const decided =
    application.status === "accepted" || application.status === "rejected";

  function setStatus(status: ApplicationStatus) {
    startTransition(async () => {
      const result = await updateApplicationStatus({
        applicationId: application.id,
        status,
        reviewNotes: notes || undefined,
      });
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function assign() {
    startTransition(async () => {
      const result = await assignApplication(application.id, leaderId);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function onboard() {
    startTransition(async () => {
      const result = await onboardApplicant({
        applicationId: application.id,
        squadId,
        squadRole,
      });
      if (result.ok) {
        toast.success(result.message);
        if (result.data) {
          setCredentials({
            email: result.data.email,
            tempPassword: result.data.tempPassword,
          });
        }
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">
            {application.ign}{" "}
            <span className="font-normal text-muted-foreground">
              · {application.fullName}
            </span>
          </CardTitle>
          <Badge variant={STATUS_VARIANTS[application.status]}>
            {APPLICATION_STATUS_LABELS[application.status]}
          </Badge>
        </div>
        <CardDescription>
          {LANE_LABELS[application.preferredLane]} · {application.currentRank} ·
          Applied {formatDateTime(application.createdAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="text-sm text-muted-foreground">
          Assigned to:{" "}
          <span className="font-medium text-foreground">
            {assignedLeaderName ?? "Unassigned"}
          </span>
        </p>

        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                View details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85dvh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{application.fullName}</DialogTitle>
                <DialogDescription>
                  Application {APPLICATION_STATUS_LABELS[application.status]}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 text-sm">
                <Row label="IGN" value={application.ign} />
                <Row
                  label="MLBB ID"
                  value={`${application.mlbbId} (${application.serverId})`}
                />
                <Row label="Email" value={application.email} />
                <Row label="Phone" value={application.phone} />
                <Row
                  label="Lane"
                  value={LANE_LABELS[application.preferredLane]}
                />
                <Row label="Rank" value={application.currentRank} />
                <Row label="Hero pool" value={application.heroPool} />
                <Row
                  label="Previous team"
                  value={application.previousTeam || "—"}
                />
                <Separator />
                <p className="text-muted-foreground">
                  {application.introduction}
                </p>
              </div>
            </DialogContent>
          </Dialog>

          {!decided && (
            <>
              {application.status !== "trial" && (
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
          <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_auto]">
            <Select value={leaderId} onValueChange={setLeaderId}>
              <SelectTrigger>
                <SelectValue placeholder="Assign to leader…" />
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
            <Label htmlFor={`notes-${application.id}`} className="text-xs">
              Review notes (saved with status changes)
            </Label>
            <Textarea
              id={`notes-${application.id}`}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        )}

        {decided && application.reviewNotes && (
          <p className="text-xs text-muted-foreground">
            Notes: {application.reviewNotes}
          </p>
        )}

        {isAdmin && application.status === "accepted" && (
          <div className="grid gap-2 rounded-lg border p-3">
            <p className="text-sm font-semibold">
              Onboard — create account & squad slot
            </p>
            <div className="grid gap-2 sm:grid-cols-[1fr_130px_auto]">
              <Select value={squadId} onValueChange={setSquadId}>
                <SelectTrigger>
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
                onValueChange={(v) => setSquadRole(v as SquadRole)}
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
              <Button
                size="sm"
                disabled={pending || !squadId}
                onClick={onboard}
              >
                Onboard
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog
        open={credentials !== null}
        onOpenChange={(open) => !open && setCredentials(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account created 🎉</DialogTitle>
            <DialogDescription>
              Share these credentials with the player — this is the only time
              the password is shown.
            </DialogDescription>
          </DialogHeader>
          {credentials && (
            <div className="grid gap-2 rounded-lg border bg-muted/40 p-4 font-mono text-sm">
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
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
