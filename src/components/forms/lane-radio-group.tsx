"use client";

import { formFieldStyles } from "@components/forms/form-field";
import { Icons } from "@components/icons";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@components/ui/shadcn/field";
import { RadioGroup, RadioGroupItem } from "@components/ui/shadcn/radio-group";
import { LANE_LABELS } from "@lib/labels";
import { cn } from "@lib/utils";
import type { Lane } from "@server/db/schema";
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

const LANE_OPTIONS: {
  value: Lane;
  label: string;
  shortLabel: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  {
    value: "exp",
    label: LANE_LABELS.exp,
    shortLabel: "EXP",
    Icon: Icons.Domain.Scrims,
  },
  {
    value: "jungle",
    label: LANE_LABELS.jungle,
    shortLabel: "Jungle",
    Icon: Icons.Domain.Lightning,
  },
  {
    value: "mid",
    label: LANE_LABELS.mid,
    shortLabel: "Mid",
    Icon: Icons.Stats.Goal,
  },
  {
    value: "gold",
    label: LANE_LABELS.gold,
    shortLabel: "Gold",
    Icon: Icons.Domain.Revenue,
  },
  {
    value: "roam",
    label: LANE_LABELS.roam,
    shortLabel: "Roam",
    Icon: Icons.Domain.Members,
  },
];

export function LaneRadioGroup<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  disabled,
}: {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field
          data-invalid={fieldState.invalid}
          className={formFieldStyles.fieldShell}
        >
          <FieldLabel className={formFieldStyles.label}>{label}</FieldLabel>
          {description && <FieldDescription>{description}</FieldDescription>}
          <div className="max-w-136">
            <RadioGroup
              name={field.name}
              value={field.value ?? ""}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              disabled={disabled}
              aria-invalid={fieldState.invalid}
              className="grid grid-cols-2 gap-2 mobile:[&>*:last-child]:col-span-2 desktop:grid-cols-5"
            >
              {LANE_OPTIONS.map(({ value, label, shortLabel, Icon }) => (
                <div key={value} className="min-w-0">
                  <RadioGroupItem
                    id={`${field.name}-${value}`}
                    value={value}
                    disabled={disabled}
                    className="peer sr-only"
                  />
                  <FieldLabel
                    htmlFor={`${field.name}-${value}`}
                    className={cn(
                      "flex h-20 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-border/70 bg-background/80 px-2 text-center shadow-inner shadow-foreground/3 transition-colors",
                      "hover:border-primary/60 hover:bg-primary/10",
                      "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/15 peer-data-[state=checked]:text-primary peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary/15 peer-data-[state=checked]:[&>span:first-child]:bg-primary peer-data-[state=checked]:[&>span:first-child]:text-primary-foreground",
                      disabled && "cursor-not-allowed opacity-60",
                    )}
                    aria-label={label}
                  >
                    <span className="flex size-8 items-center justify-center rounded-full bg-muted text-foreground transition-colors">
                      <Icon size={16} className="shrink-0" />
                    </span>
                    <span className="max-w-full truncate text-[0.68rem] font-semibold uppercase leading-none">
                      {shortLabel}
                    </span>
                  </FieldLabel>
                </div>
              ))}
            </RadioGroup>
          </div>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
