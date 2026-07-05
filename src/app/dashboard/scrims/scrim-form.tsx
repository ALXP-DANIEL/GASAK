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
import { Textarea } from "@/components/ui/shadcn/textarea";
import { createScrim } from "@/server/actions/records";

export function ScrimFormDialog({
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
    startTransition(async () => {
      const result = await createScrim({
        squadId,
        opponent: String(formData.get("opponent") ?? ""),
        date: String(formData.get("date") ?? ""),
        result: String(formData.get("result") ?? "") || undefined,
        notes: String(formData.get("notes") ?? "") || undefined,
        replayLink: String(formData.get("replayLink") ?? "") || undefined,
      });
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
          Record scrim
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record scrim</DialogTitle>
          <DialogDescription>
            Log a practice match against another team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="opponent">Opponent</Label>
              <Input id="opponent" name="opponent" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="datetime-local" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="result">Result</Label>
              <Input id="result" name="result" placeholder="Won 3-2" />
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
          </div>
          <div className="grid gap-2">
            <Label htmlFor="replayLink">Replay link</Label>
            <Input
              id="replayLink"
              name="replayLink"
              type="url"
              placeholder="https://…"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Draft takeaways, macro notes…"
            />
          </div>
          <Button type="submit" disabled={pending || !squadId}>
            {pending ? "Saving…" : "Save scrim"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
