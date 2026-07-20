"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Icons } from "@components/icons";
import { CornerCutBorder } from "@components/shared/corner-cut-border";
import { SQUAD_DIVISION_LABELS, SQUAD_DIVISION_SLUGS } from "@lib/labels";
import { cn } from "@lib/utils";
import type { SquadDivision } from "@server/db/schema";

const DIVISION_TAGLINES: Record<SquadDivision, string> = {
  gasak: "Main roster",
  nexus: "Division",
  velrix: "Division",
};

/**
 * HUD-style division selector — three corner-cut tiles acting as a radio
 * group. When `locked`, the current division stays selected and the rest
 * are disabled (dashboard list filtered to a division).
 */
export function DivisionPicker({
  value,
  onChange,
  locked = false,
}: {
  value: SquadDivision;
  onChange: (value: SquadDivision) => void;
  locked?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[0.7rem] font-semibold uppercase text-foreground/80">
          Division
        </span>
        {locked && (
          <span className="flex items-center gap-1 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
            <Icons.Status.Locked aria-hidden className="size-3" />
            Locked to this view
          </span>
        )}
      </div>
      <RadioGroup
        value={value}
        onValueChange={(next) => onChange(next as SquadDivision)}
        className="grid grid-cols-3 gap-2"
      >
        {SQUAD_DIVISION_SLUGS.map((slug) => {
          const selected = value === slug;
          return (
            <Radio.Root
              key={slug}
              value={slug}
              disabled={locked && !selected}
              className={cn(
                "group outline-none",
                locked && !selected && "cursor-not-allowed opacity-40",
                !locked && "cursor-pointer",
              )}
            >
              <CornerCutBorder
                borderClassName={cn(
                  "transition-colors",
                  selected
                    ? "bg-primary"
                    : "bg-border group-hover:bg-primary/50 group-focus-visible:bg-primary/70",
                )}
                contentClassName={cn(
                  "relative flex flex-col items-start gap-0.5 p-3 text-left transition-colors",
                  selected ? "bg-primary/10" : "bg-card",
                )}
              >
                <span
                  className={cn(
                    "font-heading text-sm font-bold uppercase tracking-wide",
                    selected ? "text-primary" : "text-foreground",
                  )}
                >
                  {SQUAD_DIVISION_LABELS[slug]}
                </span>
                <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                  {DIVISION_TAGLINES[slug]}
                </span>
                {selected && (
                  <Icons.Status.Success
                    aria-hidden
                    weight="fill"
                    className="absolute top-2 right-2 size-3.5 text-primary"
                  />
                )}
              </CornerCutBorder>
            </Radio.Root>
          );
        })}
      </RadioGroup>
    </div>
  );
}
