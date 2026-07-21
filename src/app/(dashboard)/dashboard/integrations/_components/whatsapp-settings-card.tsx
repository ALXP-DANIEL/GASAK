"use client";

import { FormField } from "@components/forms/form-field";
import { FormSection } from "@components/forms/form-section";
import { Button } from "@components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/shadcn/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateWhatsappSettings } from "@server/actions/whatsapp-settings";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const whatsappSettingsSchema = z.object({
  recruitmentRecipients: z.string().optional(),
  scheduleRecipients: z.string().optional(),
  birthdayRecipients: z.string().optional(),
});

type WhatsappSettingsInput = z.infer<typeof whatsappSettingsSchema>;

export function WhatsappSettingsCard({
  defaultValues,
}: {
  defaultValues: WhatsappSettingsInput;
}) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<WhatsappSettingsInput>({
    resolver: zodResolver(whatsappSettingsSchema),
    defaultValues,
  });

  async function onSubmit(values: WhatsappSettingsInput) {
    setSubmitting(true);
    const result = await updateWhatsappSettings(values);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle className="text-base">WhatsApp integration</CardTitle>
        <CardDescription>
          Comma-separated recipient numbers in E.164 format (e.g.
          +60123456789, +60129876543). WhatsApp has no "channel" — each number
          gets messaged directly. The schedule/birthday lists fall back to the
          recruitment list if left blank. Requires a Meta WhatsApp Business
          Cloud API token configured on the server.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
          <FormSection title="Recipients">
            <FormField
              control={form.control}
              name="recruitmentRecipients"
              label="Recruitment recipients"
              description="Instant ping when a new application is submitted."
            />
            <FormField
              control={form.control}
              name="scheduleRecipients"
              label="Schedule recipients"
              description="Daily 3pm digest of new schedule entries."
            />
            <FormField
              control={form.control}
              name="birthdayRecipients"
              label="Birthday recipients"
              description="Daily birthday announcements."
            />
          </FormSection>
          <Button type="submit" disabled={submitting} className="w-fit">
            {submitting ? "Saving..." : "Save WhatsApp settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
