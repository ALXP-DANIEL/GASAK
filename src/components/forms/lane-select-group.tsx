"use client";

import { formFieldStyles } from "@components/forms/form-field";
import { Icons } from "@components/icons";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@components/ui/shadcn/field";
import { LANE_LABELS } from "@lib/labels";
import { cn } from "@lib/utils";
import type { Lane } from "@server/db/schema";
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

type LaneOption = {
  value: Lane;
  label: string;
  shortLabel: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
};

/** Single-select lane options (Flex disabled per product decision). */
const LANE_OPTIONS: LaneOption[] = [
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

// NOTE: Multi-select + Flex option (commented for future reference):
// const FLEX_OPTION: LaneOption = {
//   value: "flex",
//   label: LANE_LABELS.flex,
//   shortLabel: "Flex",
//   Icon: Icons.Actions.SwitchFocus,
// };

function toLaneList(value: unknown): Lane[] {
  return Array.isArray(value) ? (value.filter(Boolean) as Lane[]) : [];
}

/**
 * Single-select lane picker (one lane per player).
 *
 * NOTE: Multi-select + Flex logic was disabled per product decision.
 * Re-enable by restoring FLEX_OPTION and the toggleLane multi-select logic.
 */
export function LaneSelectGroup<
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
      render={({ field, fieldState }) => {
        const selected = toLaneList(field.value);
        const activeLane = selected[0];

        const selectLane = (lane: Lane) => {
          if (disabled) return;
          // Single-select: clicking the active lane clears it, otherwise set it.
          field.onChange(activeLane === lane ? [] : [lane]);
        };

        const renderOption = ({ value, shortLabel, Icon }: LaneOption) => {
          const active = activeLane === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              aria-label={LANE_LABELS[value]}
              disabled={disabled}
              onClick={() => selectLane(value)}
              className={cn(
                "group flex h-20 min-w-0 flex-1 basis-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-border/70 bg-background/80 px-2 text-center shadow-inner shadow-foreground/3 transition-colors",
                "hover:border-primary/60 hover:bg-primary/10",
                active &&
                  "border-primary bg-primary/15 text-primary ring-2 ring-primary/15",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full bg-muted text-foreground transition-colors",
                  active && "bg-primary text-primary-foreground",
                )}
              >
                <Icon size={16} className="shrink-0" />
              </span>
              <span className="max-w-full truncate text-[0.68rem] font-semibold uppercase leading-none">
                {shortLabel}
              </span>
            </button>
          );
        };

        return (
          <Field
            data-invalid={fieldState.invalid}
            className={formFieldStyles.fieldShell}
          >
            <FieldLabel className={formFieldStyles.label}>{label}</FieldLabel>
            {description && <FieldDescription>{description}</FieldDescription>}
            <div className="max-w-136">
              <div
                className="flex items-stretch gap-2"
                aria-disabled={disabled}
              >
                {LANE_OPTIONS.map(renderOption)}
              </div>
            </div>
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
