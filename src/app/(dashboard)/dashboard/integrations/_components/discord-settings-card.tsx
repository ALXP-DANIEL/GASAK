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
import { updateDiscordSettings } from "@server/actions/discord-settings";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const discordSettingsSchema = z.object({
  recruitmentChannelId: z.string().optional(),
  scheduleChannelId: z.string().optional(),
  birthdayChannelId: z.string().optional(),
});

type DiscordSettingsInput = z.infer<typeof discordSettingsSchema>;

export function DiscordSettingsCard({
  defaultValues,
}: {
  defaultValues: DiscordSettingsInput;
}) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<DiscordSettingsInput>({
    resolver: zodResolver(discordSettingsSchema),
    defaultValues,
  });

  async function onSubmit(values: DiscordSettingsInput) {
    setSubmitting(true);
    const result = await updateDiscordSettings(values);
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
        <CardTitle className="text-base">Discord integration</CardTitle>
        <CardDescription>
          Channel IDs the bot posts to. Right-click a channel in Discord
          (Developer Mode enabled) → Copy Channel ID. The schedule/birthday
          channels fall back to the recruitment channel if left blank.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
          <FormSection title="Channels">
            <FormField
              control={form.control}
              name="recruitmentChannelId"
              label="Recruitment channel ID"
              description="Instant ping when a new application is submitted."
            />
            <FormField
              control={form.control}
              name="scheduleChannelId"
              label="Schedule channel ID"
              description="Daily 3pm digest of new schedule entries."
            />
            <FormField
              control={form.control}
              name="birthdayChannelId"
              label="Birthday channel ID"
              description="Daily birthday announcements."
            />
          </FormSection>
          <Button type="submit" disabled={submitting} className="w-fit">
            {submitting ? "Saving..." : "Save Discord settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
