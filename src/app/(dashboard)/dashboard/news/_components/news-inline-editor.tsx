"use client";

import { FormField, FormSelect } from "@components/forms/form-field";
import { FormRichText } from "@components/forms/rich-text-editor";
import { Icons } from "@components/icons";
import { DeleteButton } from "@components/shared/delete-button";
import { HtmlContent } from "@components/shared/html-content";
import { Button } from "@components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/shadcn/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDateTime } from "@lib/format";
import { deleteNews, updateNews } from "@server/actions/news";
import type { News } from "@server/db/schema";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const GLOBAL = "global";
const FORM_ID = "news-edit-form";

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  content: z.string().min(2, "Content is required"),
  audience: z.string().min(1, "Pick an audience"),
});

type Values = z.infer<typeof schema>;

function draftKey(newsId: string) {
  return `gasak:news-draft:${newsId}`;
}

function loadDraft(newsId: string): (Values & { savedAt: string }) | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(draftKey(newsId));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function NewsInlineEditor({
  news,
  squads,
  allowGlobal,
  children,
}: {
  news: News;
  squads: { id: string; name: string }[];
  allowGlobal: boolean;
  /** Extra sidebar cards rendered below the manage card (e.g. news details). */
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const skipNextSave = useRef(false);

  const original: Values = {
    title: news.title,
    content: news.content,
    audience: news.squadId ?? (allowGlobal ? GLOBAL : (squads[0]?.id ?? "")),
  };

  const { control, handleSubmit, reset } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: original,
  });

  const values = useWatch({ control });

  // Resume edit mode automatically on mount/refresh if a draft was left behind.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-check on mount or when switching posts; reset is stable
  useEffect(() => {
    const draft = loadDraft(news.id);
    if (!draft) return;
    skipNextSave.current = true;
    reset({
      title: draft.title,
      content: draft.content,
      audience: draft.audience,
    });
    setSavedAt(new Date(draft.savedAt).toLocaleTimeString());
    setEditing(true);
  }, [news.id]);

  // Autosave the draft to localStorage while editing (debounced).
  useEffect(() => {
    if (!editing) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      const now = new Date();
      window.localStorage.setItem(
        draftKey(news.id),
        JSON.stringify({ ...values, savedAt: now.toISOString() }),
      );
      setSavedAt(now.toLocaleTimeString());
    }, 500);
    return () => clearTimeout(timeout);
  }, [values, editing, news.id]);

  function startEditing() {
    const draft = loadDraft(news.id);
    skipNextSave.current = true;
    reset(
      draft
        ? {
            title: draft.title,
            content: draft.content,
            audience: draft.audience,
          }
        : original,
    );
    setSavedAt(draft ? new Date(draft.savedAt).toLocaleTimeString() : null);
    setEditing(true);
  }

  function cancelEditing() {
    window.localStorage.removeItem(draftKey(news.id));
    skipNextSave.current = true;
    reset(original);
    setSavedAt(null);
    setEditing(false);
  }

  function onSubmit(values: Values) {
    startTransition(async () => {
      const result = await updateNews(news.id, {
        title: values.title,
        content: values.content,
        squadId: values.audience === GLOBAL ? null : values.audience,
      });

      if (result.ok) {
        window.localStorage.removeItem(draftKey(news.id));
        toast.success(result.message);
        setEditing(false);
        router.refresh();
        return;
      }

      toast.error(result.error);
    });
  }

  const audienceOptions = [
    ...(allowGlobal ? [{ value: GLOBAL, label: "Global" }] : []),
    ...squads.map((squad) => ({ value: squad.id, label: squad.name })),
  ];

  return (
    <div className="grid gap-6 desktop:grid-cols-[minmax(0,1fr)_24rem]">
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Icons.Domain.News size={14} />
            {formatDateTime(news.createdAt)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form
              id={FORM_ID}
              onSubmit={handleSubmit(onSubmit)}
              className="grid gap-4"
            >
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
          ) : (
            <HtmlContent content={news.content} />
          )}
        </CardContent>
      </Card>

      <div className="grid h-fit gap-4">
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle>Manage news post</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              {editing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                    onClick={cancelEditing}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" form={FORM_ID} disabled={pending}>
                    {pending ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={startEditing}>
                  <Icons.Actions.Edit />
                  Edit
                </Button>
              )}
              <DeleteButton
                action={deleteNews.bind(null, news.id)}
                title="Delete news post?"
                description={`This will permanently remove "${news.title}".`}
                redirectTo="/dashboard/news"
              />
            </div>
            {editing && (
              <p className="text-xs text-muted-foreground">
                {savedAt
                  ? `Draft saved locally at ${savedAt}`
                  : "Not saved yet"}
              </p>
            )}
          </CardContent>
        </Card>

        {children}
      </div>
    </div>
  );
}
