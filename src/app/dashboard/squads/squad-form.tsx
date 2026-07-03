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
import { Textarea } from "@/components/ui/shadcn/textarea";
import { createSquad, updateSquad } from "@/server/actions/squads";
import type { Squad } from "@/server/db/schema";

export function SquadFields({ squad }: { squad?: Squad }) {
  const [customAccent, setCustomAccent] = useState(Boolean(squad?.accentColor));

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required defaultValue={squad?.name} />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center gap-2">
          <input
            id="customAccent"
            type="checkbox"
            checked={customAccent}
            onChange={(e) => setCustomAccent(e.target.checked)}
          />
          <Label htmlFor="customAccent">Custom accent color</Label>
        </div>
        {customAccent && (
          <Input
            id="accentColor"
            name="accentColor"
            type="color"
            className="h-10 w-20 p-1"
            defaultValue={squad?.accentColor ?? "#d97b16"}
          />
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={squad?.description ?? ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="logo">Logo image {squad?.logoUrl && "(replace)"}</Label>
        <Input id="logo" name="logo" type="file" accept="image/*" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="banner">
          Banner image {squad?.bannerUrl && "(replace)"}
        </Label>
        <Input id="banner" name="banner" type="file" accept="image/*" />
      </div>
    </>
  );
}

export function SquadFormDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createSquad(formData);
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
          New squad
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create squad</DialogTitle>
          <DialogDescription>
            Add a new competitive squad to GASAK.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <SquadFields />
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create squad"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SquadEditForm({ squad }: { squad: Squad }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateSquad(squad.id, formData);
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
      <SquadFields squad={squad} />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
