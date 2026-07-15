"use client";

import { formFieldStyles } from "@components/forms/form-field";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@components/ui/shadcn/field";
import { RANK_TIER_ICON } from "@lib/rank-icons";
import {
  DIVISIONED_RANKS,
  isDivisioned,
  isUncappedRank,
  type MlbbRank,
  RANK_TIER_OPTIONS,
  type RankTier,
  rankOrder,
  rankStarBounds,
  tierBaseOrder,
  toRoman,
} from "@lib/ranks";
import { cn } from "@lib/utils";
import Image from "next/image";
import { useEffect } from "react";
import {
  type Control,
  Controller,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

type RankSelectProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  description?: string;
  disabled?: boolean;
  /** When set, tiers stronger than this rank are disabled (e.g. current <= peak). */
  maxRank?: MlbbRank | null;
  /** When true, only the tier grid shows — division/star pickers are hidden
   * (e.g. flat-rate packages price by tier alone, so division/stars are
   * meaningless there). */
  tierOnly?: boolean;
  /** Hint under the "Rank tier" heading — defaults to the "current rank"
   * wording, override for other uses (e.g. a target/goal rank picker). */
  tierHint?: string;
};

export function RankSelect<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  disabled = false,
  maxRank = null,
  tierOnly = false,
  tierHint,
}: RankSelectProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <RankField
          field={field}
          fieldState={fieldState}
          label={label}
          description={description}
          disabled={disabled}
          maxRank={maxRank}
          tierOnly={tierOnly}
          tierHint={tierHint}
        />
      )}
    />
  );
}

function RankField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  field,
  fieldState,
  label,
  description,
  disabled = false,
  maxRank = null,
  tierOnly = false,
  tierHint = "Select the highest rank you currently hold.",
}: {
  field: ControllerRenderProps<TFieldValues, TName>;
  fieldState: ControllerFieldState;
  label: string;
  description?: string;
  disabled?: boolean;
  maxRank?: MlbbRank | null;
  tierOnly?: boolean;
  tierHint?: string;
}) {
  const value = (field.value ?? {}) as Partial<MlbbRank>;

  const tier = value.tier ?? null;
  const divisioned = tier ? isDivisioned(tier) : false;
  const uncapped = tier ? isUncappedRank(tier) : false;
  const maxRankOrder =
    maxRank && rankOrder(maxRank) >= 0 ? rankOrder(maxRank) : null;

  const bounds = tier
    ? rankStarBounds(tier)
    : {
        min: 0,
        max: 0,
      };

  // Highest star count allowed for the current tier, given the maxRank cap.
  const effectiveMax =
    tier && maxRank && tier === maxRank.tier
      ? Math.min(bounds.max, maxRank.stars ?? bounds.max)
      : bounds.max;

  const stars = tier
    ? clamp(value.stars ?? bounds.min, bounds.min, effectiveMax)
    : 0;

  // Keep the current rank within the maxRank constraint whenever it changes
  // (e.g. the user lowers their peak rank).
  useEffect(() => {
    if (!maxRank) return;
    const current = field.value as Partial<MlbbRank> | undefined;
    if (!current?.tier) return;
    if (rankOrder(current) > rankOrder(maxRank)) {
      if (current.tier === maxRank.tier) {
        field.onChange({
          tier: maxRank.tier,
          division: maxRank.division,
          stars: maxRank.stars,
        } satisfies MlbbRank);
      } else {
        field.onChange(maxRank);
      }
    }
  }, [maxRank, field.value, field.onChange]);

  const selectTier = (nextTier: RankTier) => {
    if (disabled) return;

    const nextDivisioned = isDivisioned(nextTier);
    const nextBounds = rankStarBounds(nextTier);

    field.onChange({
      tier: nextTier,
      division: nextDivisioned ? 1 : null,
      stars: nextBounds.min,
    } satisfies MlbbRank);
  };

  const selectDivision = (division: number) => {
    if (disabled || !tier || !divisioned) return;

    field.onChange({
      tier,
      division,
      stars,
    } satisfies MlbbRank);
  };

  const setStars = (nextStars: number) => {
    if (disabled || !tier) return;

    field.onChange({
      tier,
      division: divisioned ? (value.division ?? 1) : null,
      stars: clamp(nextStars, bounds.min, effectiveMax),
    } satisfies MlbbRank);
  };

  const divisionOptions =
    tier && divisioned
      ? Array.from(
          {
            length:
              DIVISIONED_RANKS[tier as keyof typeof DIVISIONED_RANKS].divisions,
          },
          (_, index) => index + 1,
        )
      : [];

  return (
    <Field
      data-invalid={fieldState.invalid}
      className={formFieldStyles.fieldShell}
    >
      <div className="space-y-1">
        <FieldLabel className={formFieldStyles.label}>{label}</FieldLabel>

        {description && <FieldDescription>{description}</FieldDescription>}
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-xl border bg-card",
          "transition-colors duration-200",
          fieldState.invalid ? "border-destructive/60" : "border-border",
          disabled && "opacity-60",
        )}
      >
        <div className="space-y-6 p-4">
          {/* Tier selection */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Rank tier
              </p>

              <p className="mt-1 text-xs text-muted-foreground/80">
                {tierHint}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 desktop:grid-cols-5">
              {RANK_TIER_OPTIONS.map((option) => {
                const optionTier = option.value as RankTier;
                const selected = tier === optionTier;
                const aboveCap =
                  maxRankOrder !== null &&
                  tierBaseOrder(optionTier) > maxRankOrder;

                return (
                  <button
                    key={optionTier}
                    type="button"
                    disabled={disabled || aboveCap}
                    aria-pressed={selected}
                    onClick={() => selectTier(optionTier)}
                    className={cn(
                      "group relative flex min-h-24 flex-col items-start justify-between overflow-hidden rounded-lg border p-3 text-left",
                      "transition-[border-color,background-color,transform,box-shadow] duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      "disabled:pointer-events-none",
                      aboveCap && "pointer-events-none opacity-40 saturate-0",
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-muted/30",
                    )}
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <Image
                        src={RANK_TIER_ICON[optionTier]}
                        alt=""
                        width={28}
                        height={28}
                        className={cn(
                          "size-7 object-contain transition-[filter] duration-200",
                          !selected && "opacity-70 saturate-[0.4]",
                        )}
                      />
                    </div>

                    <span
                      className={cn(
                        "mt-3 text-xs font-medium leading-tight",
                        selected
                          ? "text-foreground"
                          : "text-muted-foreground transition-colors group-hover:text-foreground",
                      )}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rank configuration */}
          {tier && !tierOnly && (
            <div className="grid gap-4 border-t border-border pt-5 desktop:grid-cols-[minmax(0,1fr)_18rem]">
              {/* Division */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Division
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground/80">
                    {divisioned
                      ? "Choose your current division."
                      : `${tier} uses stars instead of divisions.`}
                  </p>
                </div>

                {divisioned ? (
                  <div className="flex flex-wrap gap-2">
                    {divisionOptions.map((division) => {
                      const selected = (value.division ?? 1) === division;

                      return (
                        <button
                          key={division}
                          type="button"
                          disabled={disabled}
                          aria-pressed={selected}
                          onClick={() => selectDivision(division)}
                          className={cn(
                            "flex h-10 min-w-12 items-center justify-center rounded-md border px-3",
                            "text-sm font-semibold transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted hover:text-foreground",
                          )}
                        >
                          {toRoman(division)}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-10 items-center rounded-md border border-dashed border-border bg-muted/20 px-3">
                    <p className="text-xs text-muted-foreground">
                      Not applicable for this tier
                    </p>
                  </div>
                )}
              </div>

              {/* Stars */}
              <div className="space-y-3">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Stars
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground/80">
                      Range:{" "}
                      {effectiveMax === Infinity
                        ? `${bounds.min}+`
                        : `${bounds.min}–${effectiveMax}`}
                    </p>
                  </div>

                  <span className="text-xs font-medium text-muted-foreground">
                    {uncapped && effectiveMax === Infinity
                      ? `${stars} ★ · Uncapped`
                      : `${stars} / ${effectiveMax}`}
                  </span>
                </div>

                <div className="flex h-12 overflow-hidden rounded-lg border border-border bg-background">
                  <button
                    type="button"
                    disabled={disabled || stars <= bounds.min}
                    aria-label="Decrease stars"
                    onClick={() => setStars(stars - 1)}
                    className={cn(
                      "flex w-12 shrink-0 items-center justify-center border-r border-border",
                      "text-xl text-muted-foreground transition-colors",
                      "hover:bg-muted hover:text-foreground",
                      "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
                      "disabled:cursor-not-allowed disabled:opacity-30",
                    )}
                  >
                    −
                  </button>

                  <div className="relative min-w-0 flex-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={bounds.min}
                      max={effectiveMax === Infinity ? undefined : effectiveMax}
                      disabled={disabled}
                      value={stars}
                      aria-label="Rank stars"
                      onBlur={field.onBlur}
                      onChange={(event) => {
                        const nextValue = event.currentTarget.valueAsNumber;

                        if (!Number.isNaN(nextValue)) {
                          setStars(nextValue);
                        }
                      }}
                      className={cn(
                        "size-full border-0 bg-transparent px-3 text-center text-base font-semibold text-foreground",
                        "outline-none",
                        "[appearance:textfield]",
                        "[&::-webkit-inner-spin-button]:appearance-none",
                        "[&::-webkit-outer-spin-button]:appearance-none",
                      )}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={disabled || stars >= effectiveMax}
                    aria-label="Increase stars"
                    onClick={() => setStars(stars + 1)}
                    className={cn(
                      "flex w-12 shrink-0 items-center justify-center border-l border-border",
                      "text-xl text-muted-foreground transition-colors",
                      "hover:bg-muted hover:text-foreground",
                      "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
                      "disabled:cursor-not-allowed disabled:opacity-30",
                    )}
                  >
                    +
                  </button>
                </div>

                {effectiveMax !== Infinity && (
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-300"
                      style={{
                        width: `${getStarProgress(
                          stars,
                          bounds.min,
                          effectiveMax,
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <FieldError errors={[fieldState.error]} />
    </Field>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getStarProgress(value: number, min: number, max: number) {
  if (max <= min) return 100;

  return ((value - min) / (max - min)) * 100;
}
