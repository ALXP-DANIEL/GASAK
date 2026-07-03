"use client";

import { Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import { createAnnouncement } from "@/server/actions/announcements";

export function AnnouncementFormDialog({
  squads,
  allowGlobal,
}: {
  squads: { id: string; name: string }[];
  allowGlobal: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(
    allowGlobal ? "global" : (squads[0]?.id ?? ""),
  );
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createAnnouncement({
        title: String(formData.get("title") ?? ""),
        content: String(formData.get("content") ?? ""),
        squadId: target === "global" ? null : target,
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
          <Plus size={16} />
          New announcement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New announcement</DialogTitle>
          <DialogDescription>
            {allowGlobal
              ? "Post globally or to a specific squad."
              : "Post to a squad you lead."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="grid gap-2">
            <Label>Audience</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger>
                <SelectValue placeholder="Pick audience" />
              </SelectTrigger>
              <SelectContent>
                {allowGlobal && (
                  <SelectItem value="global">🌐 Global (everyone)</SelectItem>
                )}
                {squads.map((squad) => (
                  <SelectItem key={squad.id} value={squad.id}>
                    {squad.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">Content</Label>
            <Textarea id="content" name="content" rows={5} required />
          </div>
          <Button type="submit" disabled={pending || !target}>
            {pending ? "Posting…" : "Post announcement"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
