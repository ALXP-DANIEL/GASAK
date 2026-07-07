"use client";

import {
  DashboardForm,
  DashboardFormGrid,
} from "@components/forms/dashboard-form";
import {
  FormField,
  FormFileInput,
  FormSelect,
} from "@components/forms/form-field";
import { Button } from "@components/ui/shadcn/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { LANE_LABELS } from "@lib/labels";
import { updateProfile } from "@server/actions/players";
import { laneEnum } from "@server/db/schema";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const profileFormSchema = z.object({
  name: z.string().min(2, "Display name is required"),
  fullName: z.string().optional(),
  nickname: z.string().optional(),
  ign: z.string().optional(),
  mlbbId: z.string().optional(),
  serverId: z.string().optional(),
  phone: z.string().optional(),
  preferredLane: z.string().optional(),
  currentRank: z.string().optional(),
  peakRank: z.string().optional(),
  avatar: z.instanceof(File).nullable(),
});

type ProfileFormInput = z.infer<typeof profileFormSchema>;

export function ProfileForm({
  userId,
  defaultValues,
  imageUrl,
}: {
  userId: string;
  defaultValues: ProfileFormInput;
  imageUrl?: string | null;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const laneOptions = laneEnum.enumValues.map((value) => ({
    value,
    label: LANE_LABELS[value],
  }));

  const form = useForm<ProfileFormInput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { ...defaultValues, avatar: null },
  });

  async function onSubmit(values: ProfileFormInput) {
    setSubmitting(true);
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      if (value) formData.set(key, value);
    }
    const result = await updateProfile(userId, formData);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error ?? "Something went wrong");
      return;
    }

    toast.success("Profile updated");
    router.refresh();
  }

  return (
    <DashboardForm onSubmit={form.handleSubmit(onSubmit)} className="max-w-3xl">
      <DashboardFormGrid>
        <FormField control={form.control} name="name" label="Display Name" />
        <FormField control={form.control} name="fullName" label="Full Name" />
      </DashboardFormGrid>
      <div className="grid gap-2">
        <FormFileInput
          control={form.control}
          name="avatar"
          label={`Profile picture ${imageUrl ? "(replace)" : ""}`}
          accept="image/*"
        />
        {imageUrl && (
          <p className="text-xs text-muted-foreground">
            Current profile picture is used in the dashboard avatar.
          </p>
        )}
      </div>
      <DashboardFormGrid>
        <FormField control={form.control} name="nickname" label="Nickname" />
        <FormField
          control={form.control}
          name="phone"
          label="Phone"
          type="tel"
        />
      </DashboardFormGrid>
      <DashboardFormGrid columns={3}>
        <FormField control={form.control} name="ign" label="IGN" />
        <FormField control={form.control} name="mlbbId" label="MLBB ID" />
        <FormField control={form.control} name="serverId" label="Server ID" />
      </DashboardFormGrid>
      <DashboardFormGrid columns={3}>
        <FormSelect
          control={form.control}
          name="preferredLane"
          label="Preferred Lane"
          options={laneOptions}
          placeholder="Pick a lane"
        />
        <FormField
          control={form.control}
          name="currentRank"
          label="Current Rank"
        />
        <FormField control={form.control} name="peakRank" label="Peak Rank" />
      </DashboardFormGrid>
      <Button type="submit" disabled={submitting} className="w-fit">
        {submitting ? "Saving..." : "Save Profile"}
      </Button>
    </DashboardForm>
  );
}
