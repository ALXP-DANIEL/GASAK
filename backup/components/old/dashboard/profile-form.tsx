"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import { LANE_LABELS, MLBB_RANKS } from "@/lib/labels";
import { updateProfile } from "@/server/actions/players";
import { type Lane, laneEnum, type PlayerProfile } from "@/server/db/schema";

export function ProfileForm({
  targetUserId,
  displayName,
  avatarUrl,
  profile,
}: {
  targetUserId: string;
  displayName: string;
  avatarUrl: string | null;
  profile: PlayerProfile | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateProfile(targetUserId, formData);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="flex items-center gap-4">
        {avatarUrl && (
          <Image
            src={avatarUrl}
            alt="Avatar"
            width={56}
            height={56}
            className="rounded-full border object-cover"
            unoptimized
          />
        )}
        <div className="grid flex-1 gap-2">
          <Label htmlFor="avatar">Avatar {avatarUrl && "(replace)"}</Label>
          <Input id="avatar" name="avatar" type="file" accept="image/*" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="name">Display name</Label>
          <Input id="name" name="name" required defaultValue={displayName} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            name="fullName"
            defaultValue={profile?.fullName ?? ""}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="nickname">Nickname</Label>
          <Input
            id="nickname"
            name="nickname"
            defaultValue={profile?.nickname ?? ""}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ign">IGN</Label>
          <Input id="ign" name="ign" defaultValue={profile?.ign ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="mlbbId">MLBB ID</Label>
          <Input
            id="mlbbId"
            name="mlbbId"
            inputMode="numeric"
            defaultValue={profile?.mlbbId ?? ""}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="serverId">Server ID</Label>
          <Input
            id="serverId"
            name="serverId"
            inputMode="numeric"
            defaultValue={profile?.serverId ?? ""}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            placeholder="+60…"
            defaultValue={profile?.phone ?? ""}
          />
        </div>
        <div className="grid gap-2">
          <Label>Preferred lane</Label>
          <LaneSelect defaultValue={profile?.preferredLane ?? undefined} />
        </div>
        <div className="grid gap-2">
          <Label>Current rank</Label>
          <RankSelect
            name="currentRank"
            defaultValue={profile?.currentRank ?? undefined}
          />
        </div>
        <div className="grid gap-2">
          <Label>Peak rank</Label>
          <RankSelect
            name="peakRank"
            defaultValue={profile?.peakRank ?? undefined}
          />
        </div>
      </div>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

function LaneSelect({ defaultValue }: { defaultValue?: Lane }) {
  return (
    <Select name="preferredLane" defaultValue={defaultValue}>
      <SelectTrigger>
        <SelectValue placeholder="Select lane" />
      </SelectTrigger>
      <SelectContent>
        {laneEnum.enumValues.map((lane) => (
          <SelectItem key={lane} value={lane}>
            {LANE_LABELS[lane]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RankSelect({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string;
}) {
  return (
    <Select name={name} defaultValue={defaultValue}>
      <SelectTrigger>
        <SelectValue placeholder="Select rank" />
      </SelectTrigger>
      <SelectContent>
        {MLBB_RANKS.map((rank) => (
          <SelectItem key={rank} value={rank}>
            {rank}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
