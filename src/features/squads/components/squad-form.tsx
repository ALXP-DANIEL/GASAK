"use client";

import { FormField } from "@components/forms/form-field";
import { Button } from "@components/ui/shadcn/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSquad } from "@server/actions/squads";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const squadFormSchema = z.object({
  name: z.string().min(2, "Squad name is required"),
  description: z.string().optional(),
});

type SquadFormInput = z.infer<typeof squadFormSchema>;

export function SquadForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<SquadFormInput>({
    resolver: zodResolver(squadFormSchema),
    defaultValues: { name: "", description: "" },
  });

  async function onSubmit(values: SquadFormInput) {
    setSubmitting(true);
    const formData = new FormData();
    formData.set("name", values.name);
    if (values.description) formData.set("description", values.description);
    const result = await createSquad(formData);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error ?? "Something went wrong");
      return;
    }

    toast.success("Squad created");
    form.reset();
    router.refresh();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid max-w-xl gap-4"
    >
      <FormField control={form.control} name="name" label="Squad Name" />
      <FormField
        control={form.control}
        name="description"
        label="Description"
        as="textarea"
      />
      <Button type="submit" disabled={submitting} className="w-fit">
        {submitting ? "Creating..." : "Create Squad"}
      </Button>
    </form>
  );
}
