"use client";

import { formFieldStyles } from "@components/forms/form-field";
import { Icons } from "@components/icons";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@components/ui/shadcn/field";
import { FLEX_LANE, LANE_LABELS, SPECIFIC_LANES } from "@lib/labels";
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

/** The five specific lanes (multi-selectable). */
const SPECIFIC_LANE_OPTIONS: LaneOption[] = [
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

/** The flexible role: mutually exclusive with the specific lanes. */
const FLEX_OPTION: LaneOption = {
  value: FLEX_LANE,
  label: LANE_LABELS.flex,
  shortLabel: "Flex",
  Icon: Icons.Actions.SwitchFocus,
};

function toLaneList(value: unknown): Lane[] {
  return Array.isArray(value) ? (value.filter(Boolean) as Lane[]) : [];
}

/**
 * Multi-select lane picker.
 *
 * - The five specific lanes can be toggled on/off in any combination.
 * - Selecting "Flex" clears every specific lane (a flex player fills any role),
 *   and selecting any specific lane clears "Flex". The two are never combined.
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
        const isFlex = selected.includes(FLEX_LANE);

        const toggleLane = (lane: Lane) => {
          if (disabled) return;
          if (lane === FLEX_LANE) {
            // Flex is exclusive: toggle it on (clearing others) or off.
            field.onChange(isFlex ? [] : [FLEX_LANE]);
            return;
          }
          // Selecting a specific lane always drops Flex first.
          const withoutFlex = selected.filter((l) => l !== FLEX_LANE);
          const next: Lane[] = withoutFlex.includes(lane)
            ? withoutFlex.filter((l) => l !== lane)
            : [...withoutFlex, lane];
          // Selecting every specific lane is equivalent to Flex ("plays any role").
          if (SPECIFIC_LANES.every((l) => next.includes(l))) {
            field.onChange([FLEX_LANE]);
            return;
          }
          field.onChange(next);
        };

        const renderOption = ({
          value,
          label,
          shortLabel,
          Icon,
        }: LaneOption) => {
          const active = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              aria-label={label}
              disabled={disabled}
              onClick={() => toggleLane(value)}
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
                {renderOption(FLEX_OPTION)}
                <div className="flex shrink-0 items-center">
                  <span className="px-1 text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    or
                  </span>
                </div>
                {SPECIFIC_LANE_OPTIONS.map(renderOption)}
              </div>
            </div>
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
