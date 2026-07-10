"use client";

import { formFieldStyles } from "@components/forms/form-field";
import { Icons } from "@components/icons";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@components/ui/shadcn/field";
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
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

const TIER_COLOR: Record<RankTier, string> = {
  Warrior: "#94a3b8",
  Elite: "#22c55e",
  Master: "#3b82f6",
  Grandmaster: "#a855f7",
  Epic: "#fb923c",
  Legend: "#eab308",
  Mythic: "#ef4444",
  "Mythical Honor": "#06b6d4",
  "Mythical Glory": "#d946ef",
  "Mythical Immortal": "#f59e0b",
};

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
}: RankSelectProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
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

        const stars = tier
          ? clamp(value.stars ?? bounds.min, bounds.min, bounds.max)
          : 0;

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
            stars: clamp(nextStars, bounds.min, bounds.max),
          } satisfies MlbbRank);
        };

        const divisionOptions =
          tier && divisioned
            ? Array.from(
                {
                  length:
                    DIVISIONED_RANKS[
                      tier as keyof typeof DIVISIONED_RANKS
                    ].divisions,
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
              <FieldLabel className={formFieldStyles.label}>
                {label}
              </FieldLabel>

              {description && (
                <FieldDescription>{description}</FieldDescription>
              )}
            </div>

            <div
              className={cn(
                "overflow-hidden rounded-xl border bg-card",
                "transition-colors duration-200",
                fieldState.invalid
                  ? "border-destructive/60"
                  : "border-border",
                disabled && "opacity-60",
              )}
            >
              {/* Current selection */}
              <div className="flex min-h-20 items-center justify-between gap-4 border-b border-border bg-muted/20 px-4 py-3">
                {tier ? (
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-background"
                      style={{
                        borderColor: `${TIER_COLOR[tier]}66`,
                        background: `color-mix(in srgb, ${TIER_COLOR[tier]} 8%, transparent)`,
                      }}
                    >
                      <Icons.Stats.Trophies
                        size={22}
                        weight="fill"
                        style={{
                          color: TIER_COLOR[tier],
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {tier}
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {divisioned && (
                          <>
                            Division {toRoman(value.division ?? 1)}
                            <span className="mx-1.5">·</span>
                          </>
                        )}

                        {stars} {stars === 1 ? "star" : "stars"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-lg border border-dashed border-border bg-background text-muted-foreground">
                      <Icons.Stats.Trophies size={20} />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-foreground">
                        No rank selected
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Choose your current MLBB rank below.
                      </p>
                    </div>
                  </div>
                )}

                {tier && (
                  <div
                    className="hidden size-2.5 shrink-0 rounded-full desktop:block"
                    style={{
                      backgroundColor: TIER_COLOR[tier],
                      boxShadow: `0 0 12px ${TIER_COLOR[tier]}`,
                    }}
                  />
                )}
              </div>

              <div className="space-y-6 p-4">
                {/* Tier selection */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Rank tier
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground/80">
                      Select the highest rank you currently hold.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 desktop:grid-cols-5">
                    {RANK_TIER_OPTIONS.map((option) => {
                      const optionTier = option.value as RankTier;
                      const color = TIER_COLOR[optionTier];
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
                              ? "bg-muted/40"
                              : "border-border bg-background hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-muted/30",
                          )}
                          style={
                            selected
                              ? {
                                  borderColor: color,
                                  background: `linear-gradient(
                                    145deg,
                                    color-mix(in srgb, ${color} 12%, transparent),
                                    transparent 70%
                                  )`,
                                  boxShadow: `0 10px 30px -22px ${color}`,
                                }
                              : undefined
                          }
                        >
                          <div className="flex w-full items-start justify-between gap-2">
                            <Icons.Stats.Trophies
                              size={19}
                              weight={selected ? "fill" : "regular"}
                              style={{
                                color: selected
                                  ? color
                                  : "var(--muted-foreground)",
                              }}
                            />

                            {selected && (
                              <span
                                className="size-2 rounded-full"
                                style={{
                                  backgroundColor: color,
                                  boxShadow: `0 0 10px ${color}`,
                                }}
                              />
                            )}
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
                {tier && (
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
                            const selected =
                              (value.division ?? 1) === division;

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
                            Range: {uncapped ? `${bounds.min}+` : `${bounds.min}–${bounds.max}`}
                          </p>
                        </div>

                        <span className="text-xs font-medium text-muted-foreground">
                          {uncapped ? `${stars} ★ · Uncapped` : `${stars} / ${bounds.max}`}
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
                            max={uncapped ? undefined : bounds.max}
                            disabled={disabled}
                            value={stars}
                            aria-label="Rank stars"
                            onBlur={field.onBlur}
                            onChange={(event) => {
                              const nextValue =
                                event.currentTarget.valueAsNumber;

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
                          disabled={disabled || stars >= bounds.max}
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

                      {!uncapped && (
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full transition-[width] duration-300"
                            style={{
                              width: `${getStarProgress(
                                stars,
                                bounds.min,
                                bounds.max,
                              )}%`,
                              backgroundColor: TIER_COLOR[tier],
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
      }}
    />
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getStarProgress(value: number, min: number, max: number) {
  if (max <= min) return 100;

  return ((value - min) / (max - min)) * 100;
}
