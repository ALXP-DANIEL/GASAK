"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ActionResult } from "@server/actions/public";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { DefaultValues, FieldValues, Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { ZodType } from "zod";

export function useEntityDialog<TValues extends FieldValues>({
  schema,
  defaultValues,
  action,
  successMessage,
}: {
  schema: ZodType<TValues, TValues>;
  defaultValues: DefaultValues<TValues>;
  action: (values: TValues) => Promise<ActionResult>;
  successMessage?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<TValues>({
    resolver: zodResolver(schema) as Resolver<TValues>,
    defaultValues,
  });

  function onSubmit(values: TValues) {
    startTransition(async () => {
      const result = await action(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message ?? successMessage);
      setOpen(false);
      form.reset(defaultValues);
      router.refresh();
    });
  }

  return {
    open,
    setOpen,
    control: form.control,
    pending,
    handleSubmit: form.handleSubmit(onSubmit),
    /** Escape hatch for dialogs that need more than `control` — useFieldArray, setValue, watch, etc. */
    form,
  };
}
