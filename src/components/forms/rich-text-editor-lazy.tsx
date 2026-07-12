"use client";

import { Skeleton } from "@components/ui/shadcn/skeleton";
import dynamic from "next/dynamic";
import type { FormRichText as FormRichTextType } from "./rich-text-editor";

/**
 * Tiptap (and its extensions) is a large client-only bundle. Loading it on
 * demand keeps news forms from dragging the whole editor into the page's
 * initial JS — the skeleton reserves the editor's footprint meanwhile.
 */
export const FormRichText = dynamic(
  () => import("./rich-text-editor").then((mod) => mod.FormRichText),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    ),
  },
) as typeof FormRichTextType;
