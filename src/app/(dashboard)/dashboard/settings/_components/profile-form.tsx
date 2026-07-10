"use client";

import {
  DashboardForm,
  DashboardFormGrid,
} from "@components/forms/dashboard-form";
import { FormField, FormFileInput } from "@components/forms/form-field";
import { LaneSelectGroup } from "@components/forms/lane-select-group";
import { MlbbIdFields } from "@components/forms/mlbb-id-fields";
import { PhonePrefixField } from "@components/forms/phone-prefix-field";
import { Button } from "@components/ui/shadcn/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfile } from "@server/actions/players";
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
  preferredLanes: z.array(z.string()).optional(),
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

  const form = useForm<ProfileFormInput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { ...defaultValues, avatar: null },
  });

  async function onSubmit(values: ProfileFormInput) {
    setSubmitting(true);
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      if (key === "preferredLanes") continue;
      if (value == null || value === "") continue;
      if (value instanceof File) {
        formData.set(key, value);
        continue;
      }
      if (typeof value === "string") {
        formData.set(key, key === "phone" ? toMalaysiaPhone(value) : value);
      }
    }
    // Multi-select lanes are sent as a JSON array (always sent so it can be cleared).
    formData.set("preferredLanes", JSON.stringify(values.preferredLanes ?? []));
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
        <PhonePrefixField control={form.control} name="phone" label="Phone" />
      </DashboardFormGrid>
      <DashboardFormGrid>
        <FormField control={form.control} name="ign" label="IGN" />
        <MlbbIdFields
          control={form.control}
          mlbbIdName="mlbbId"
          serverIdName="serverId"
        />
      </DashboardFormGrid>
      <LaneSelectGroup
        control={form.control}
        name="preferredLanes"
        label="Preferred lanes"
        description="Pick the lanes you play, or choose Flex if you can fill any role."
      />
      <DashboardFormGrid>
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

function toMalaysiaPhone(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^60/, "").replace(/^0/, "");
  return `+60${digits}`;
}
