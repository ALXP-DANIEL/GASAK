"use client";

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
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>{label}</FieldLabel>
          {description && <FieldDescription>{description}</FieldDescription>}
          <div className="max-w-[27rem]">
            <RadioGroup
              name={field.name}
              value={field.value ?? ""}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              disabled={disabled}
              aria-invalid={fieldState.invalid}
              className="grid grid-cols-5 gap-2"
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
                      "flex h-14 w-full cursor-pointer flex-col items-center justify-center gap-1 border border-border bg-background px-1 text-center transition-colors",
                      "hover:border-primary/60 hover:bg-primary/10",
                      "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/15 peer-data-[state=checked]:text-primary",
                      disabled && "cursor-not-allowed opacity-60",
                    )}
                    aria-label={label}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className="max-w-full truncate text-[9px] font-semibold uppercase leading-none tracking-wider">
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
