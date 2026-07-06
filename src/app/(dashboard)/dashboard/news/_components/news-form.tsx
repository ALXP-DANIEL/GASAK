"use client";

import { FormField, FormSelect } from "@components/forms/form-field";
import { Icons } from "@components/icons";
import { Button } from "@components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/shadcn/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { createNews } from "@server/actions/news";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const GLOBAL = "global";

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  content: z.string().min(2, "Content is required"),
  audience: z.string().min(1, "Pick an audience"),
});

type Values = z.infer<typeof schema>;

export function NewsFormDialog({
  squads,
  allowGlobal,
}: {
  squads: { id: string; name: string }[];
  allowGlobal: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const audienceOptions = [
    ...(allowGlobal ? [{ value: GLOBAL, label: "Global" }] : []),
    ...squads.map((squad) => ({ value: squad.id, label: squad.name })),
  ];

  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      content: "",
      audience: allowGlobal ? GLOBAL : (squads[0]?.id ?? ""),
    },
  });

  function onSubmit(values: Values) {
    startTransition(async () => {
      const result = await createNews({
        title: values.title,
        content: values.content,
        squadId: values.audience === GLOBAL ? null : values.audience,
      });

      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
        return;
      }

      toast.error(result.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Icons.Actions.Add />
          New news post
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New news post</DialogTitle>
          <DialogDescription>
            {allowGlobal
              ? "Post globally or to a specific squad."
              : "Post to a squad you lead."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <FormField control={control} name="title" label="Title" />
          <FormSelect
            control={control}
            name="audience"
            label="Audience"
            options={audienceOptions}
            placeholder="Pick audience"
          />
          <FormField
            control={control}
            name="content"
            label="Content"
            as="textarea"
            rows={5}
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Posting..." : "Post news"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
