"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/shadcn/dialog";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import { createTournament } from "@/server/actions/records";

export function TournamentFormDialog({
  squads,
}: {
  squads: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [squadId, setSquadId] = useState(squads[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("squadId", squadId);
    startTransition(async () => {
      const result = await createTournament(formData);
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Icons.Actions.Add size={16} />
          Record tournament
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record tournament</DialogTitle>
          <DialogDescription>
            Log an official tournament and its result.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Tournament name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="organizer">Organizer</Label>
              <Input id="organizer" name="organizer" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="datetime-local" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prize">Prize</Label>
              <Input id="prize" name="prize" placeholder="RM 5,000" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="opponent">Opponent</Label>
              <Input id="opponent" name="opponent" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="result">Result</Label>
              <Input
                id="result"
                name="result"
                placeholder="Won 3-1 (Champion)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mvp">MVP</Label>
              <Input id="mvp" name="mvp" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Squad</Label>
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
          </div>
          <div className="grid gap-2">
            <Label htmlFor="screenshot">Result screenshot (optional)</Label>
            <Input
              id="screenshot"
              name="screenshot"
              type="file"
              accept="image/*"
            />
          </div>
          <Button type="submit" disabled={pending || !squadId}>
            {pending ? "Saving…" : "Save tournament"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
