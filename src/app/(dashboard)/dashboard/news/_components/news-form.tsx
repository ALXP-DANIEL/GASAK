"use client";

import { FormField, FormSelect } from "@components/forms/form-field";
import { FormRichText } from "@components/forms/rich-text-editor-lazy";
import { Icons } from "@components/icons";
import { useEntityDialog } from "@components/shared/use-entity-dialog";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@components/ui/credenza";
import { Button } from "@components/ui/shadcn/button";
import { createNews } from "@server/actions/news";
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
  const audienceOptions = [
    ...(allowGlobal ? [{ value: GLOBAL, label: "Global" }] : []),
    ...squads.map((squad) => ({ value: squad.id, label: squad.name })),
  ];

  const { open, setOpen, control, pending, handleSubmit } =
    useEntityDialog<Values>({
      schema,
      defaultValues: {
        title: "",
        content: "",
        audience: allowGlobal ? GLOBAL : (squads[0]?.id ?? ""),
      },
      action: (values) =>
        createNews({
          title: values.title,
          content: values.content,
          squadId: values.audience === GLOBAL ? null : values.audience,
        }),
    });

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        <Button>
          <Icons.Actions.Add />
          New news post
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>New news post</CredenzaTitle>
          <CredenzaDescription>
            {allowGlobal
              ? "Post globally or to a specific squad."
              : "Post to a squad you lead."}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form id="news-form" onSubmit={handleSubmit} className="grid gap-5">
            <FormField control={control} name="title" label="Title" />
            <FormSelect
              control={control}
              name="audience"
              label="Audience"
              options={audienceOptions}
              placeholder="Pick audience"
            />
            <FormRichText control={control} name="content" label="Content" />
          </form>
        </CredenzaBody>
        <CredenzaFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="news-form" disabled={pending}>
            {pending ? "Posting..." : "Post news"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
