"use client";

import { FormField } from "@components/forms/form-field";
import { FormSection } from "@components/forms/form-section";
import {
  type ImageCropConfig,
  ImageCropDialog,
} from "@components/forms/image-crop-dialog";
import { LaneSelectGroup } from "@components/forms/lane-select-group";
import { MlbbIdFields } from "@components/forms/mlbb-id-fields";
import { PhonePrefixField } from "@components/forms/phone-prefix-field";
import { RankSelect } from "@components/forms/rank-select";
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@components/ui/shadcn/avatar";
import { Button } from "@components/ui/shadcn/button";
import { initials } from "@lib/format";
import { toMalaysiaPhone } from "@lib/phone";
import { cn } from "@lib/utils";
import { updateProfile } from "@server/actions/players";
import { useEffect, useRef, useState } from "react";
import { type Control, useController } from "react-hook-form";
import {
  type ProfileFormInput,
  profileFormSchema,
} from "./profile-form-schema";

const AVATAR_CROP: ImageCropConfig = {
  aspect: 1,
  outputWidth: 512,
  outputHeight: 512,
  cropShape: "round",
};

const FORM_ID = "profile-edit-form";

function useObjectUrl(file: File | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}

/** Circular avatar with a floating upload badge — click or drop a new photo, crop, done. */
function AvatarPicker({
  control,
  imageUrl,
  displayName,
  disabled,
}: {
  control: Control<ProfileFormInput>;
  imageUrl?: string | null;
  displayName: string;
  disabled?: boolean;
}) {
  const { field, fieldState } = useController({ control, name: "avatar" });
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pendingCrop, setPendingCrop] = useState<{
    url: string;
    fileName: string;
  } | null>(null);
  const previewUrl = useObjectUrl(field.value);

  function clearInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  function closeCropDialog() {
    if (pendingCrop) URL.revokeObjectURL(pendingCrop.url);
    setPendingCrop(null);
    clearInput();
  }

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="group relative">
        <div
          aria-hidden
          className="absolute inset-0 -m-2 rounded-full bg-primary/25 blur-lg transition-opacity group-hover:opacity-80"
        />
        <Avatar className="relative size-28 border-2 border-primary/40 shadow-glow">
          <AvatarImage
            src={previewUrl ?? imageUrl ?? undefined}
            alt={displayName}
          />
          <AvatarFallback className="bg-primary/10 font-heading text-3xl font-bold text-primary">
            {initials(displayName || "Player")}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          aria-label="Change profile picture"
          className={cn(
            "absolute right-0 bottom-0 flex size-9 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md transition-transform",
            "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            disabled && "pointer-events-none opacity-60",
          )}
        >
          <Icons.Actions.Upload size={15} />
        </button>
        <input
          ref={(node) => {
            field.ref(node);
            inputRef.current = node;
          }}
          type="file"
          accept="image/*"
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setPendingCrop({
              url: URL.createObjectURL(file),
              fileName: file.name,
            });
          }}
        />
      </div>
      <p className="text-center text-[0.68rem] text-muted-foreground">
        PNG or JPG, cropped to a square.
      </p>
      {fieldState.error && (
        <p className="text-center text-xs text-destructive">
          {fieldState.error.message}
        </p>
      )}

      <ImageCropDialog
        open={pendingCrop !== null}
        imageUrl={pendingCrop?.url ?? null}
        fileName={pendingCrop?.fileName ?? "avatar"}
        config={AVATAR_CROP}
        onCancel={closeCropDialog}
        onConfirm={(file) => {
          field.onChange(file);
          closeCropDialog();
        }}
      />
    </div>
  );
}

/**
 * Edit-in-place credenza for a player profile — reused on the account
 * profile page (editing yourself) and the admin player detail page
 * (editing another player).
 */
export function ProfileEditDialog({
  userId,
  imageUrl,
  defaultValues,
  triggerLabel = "Edit Profile",
}: {
  userId: string;
  imageUrl?: string | null;
  defaultValues: Omit<ProfileFormInput, "avatar">;
  triggerLabel?: string;
}) {
  const { open, setOpen, control, pending, handleSubmit, form } =
    useEntityDialog<ProfileFormInput>({
      schema: profileFormSchema,
      defaultValues: { ...defaultValues, avatar: null },
      successMessage: "Profile updated",
      action: (values) => {
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
          } else if (typeof value === "object" && !(value instanceof File)) {
            // Structured values (ranks) are sent as JSON so they can be cleared.
            formData.set(key, JSON.stringify(value));
          }
        }
        // Multi-select lanes are sent as a JSON array (always sent so it can be cleared).
        formData.set(
          "preferredLanes",
          JSON.stringify(values.preferredLanes ?? []),
        );
        return updateProfile(userId, formData);
      },
    });

  const name = form.watch("name");
  const ign = form.watch("ign");
  const peakRank = form.watch("peakRank");

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        <Button variant="outline" size="sm">
          <Icons.Actions.Edit />
          {triggerLabel}
        </Button>
      </CredenzaTrigger>
      <CredenzaContent className="sm:max-w-2xl desktop:max-w-5xl">
        <CredenzaHeader>
          <CredenzaTitle>Edit profile</CredenzaTitle>
          <CredenzaDescription>
            Update your display name, contact info, and player details.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="p-0">
          <form
            id={FORM_ID}
            onSubmit={handleSubmit}
            className="grid gap-0 desktop:grid-cols-[15rem_1fr]"
          >
            <aside className="bg-grid relative flex flex-col items-center gap-4 overflow-hidden border-b border-border/70 p-5 desktop:border-r desktop:border-b-0">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-40"
              />
              <div className="relative flex flex-col items-center gap-4">
                <AvatarPicker
                  control={control}
                  imageUrl={imageUrl}
                  displayName={ign || name || "Player"}
                />
                <div className="text-center">
                  <p className="font-heading text-base font-bold uppercase leading-tight text-glow">
                    {ign || name || "Player"}
                  </p>
                  {ign && name && (
                    <p className="truncate text-xs text-muted-foreground">
                      {name}
                    </p>
                  )}
                </div>
              </div>
            </aside>

            <div className="grid gap-5 p-5">
              <FormSection title="Identity">
                <div className="grid gap-3 desktop:grid-cols-2">
                  <FormField
                    control={control}
                    name="name"
                    label="Display Name"
                  />
                  <FormField
                    control={control}
                    name="fullName"
                    label="Full Name"
                  />
                  <FormField
                    control={control}
                    name="nickname"
                    label="Nickname"
                  />
                  <PhonePrefixField
                    control={control}
                    name="phone"
                    label="Phone"
                  />
                </div>
              </FormSection>

              <FormSection
                title="MLBB Profile"
                description="Your in-game identity, shown across squad rosters."
              >
                <div className="grid gap-3 desktop:grid-cols-2">
                  <FormField control={control} name="ign" label="IGN" />
                  <MlbbIdFields
                    control={control}
                    mlbbIdName="mlbbId"
                    serverIdName="serverId"
                  />
                </div>
              </FormSection>

              <FormSection
                title="Lanes & Rank"
                description="Pick the lanes you play and your current standing."
              >
                <LaneSelectGroup
                  control={control}
                  name="preferredLanes"
                  label="Preferred lanes"
                  description="Pick the lanes you play, or choose Flex if you can fill any role."
                />
                <div className="grid gap-3">
                  <RankSelect
                    control={control}
                    name="currentRank"
                    label="Current Rank"
                    description="Pick your tier, division, and stars."
                    maxRank={peakRank}
                  />
                  <RankSelect
                    control={control}
                    name="peakRank"
                    label="Peak Rank"
                    description="Your highest achieved rank."
                  />
                </div>
              </FormSection>
            </div>
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
          <Button type="submit" form={FORM_ID} disabled={pending}>
            {pending ? "Saving..." : "Save Profile"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
