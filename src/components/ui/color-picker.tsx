"use client";

import { Icons } from "@components/icons";
import { Button } from "@components/ui/shadcn/button";
import { Label } from "@components/ui/shadcn/label";
import { cn } from "@lib/utils";
import { useEffect, useState } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";

export type ColorPreset = {
  name: string;
  color: string;
};

export type ColorPickerProps = {
  value: string;
  onChange: (value: string) => void;
  presets?: ColorPreset[];
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: (value: string) => void;
  className?: string;
};

export function ColorPicker({
  value,
  onChange,
  presets = [],
  title = "Primary Color",
  description = "Pick a color that represents this visual system.",
  actionLabel,
  onAction,
  className,
}: ColorPickerProps) {
  const [canUseEyeDropper, setCanUseEyeDropper] = useState(false);
  const hex = normalizeHex(value);
  const contrast = getContrastColor(hex);

  useEffect(() => {
    setCanUseEyeDropper(getEyeDropper() !== null);
  }, []);

  return (
    <section
      className={cn(
        "w-full rounded-2xl border border-primary/20 bg-card p-5 shadow-[0_24px_80px_color-mix(in_oklab,var(--primary)_12%,transparent)]",
        className,
      )}
    >
      {(title || description) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-1.5">
            {title && (
              <h2 className="font-heading text-xl font-semibold tracking-wide">
                {title}
              </h2>
            )}
            {description && (
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          <div
            className="grid min-w-28 place-items-center rounded-xl border border-primary/25 px-4 py-3 text-sm font-semibold shadow-[0_0_32px_color-mix(in_oklab,var(--primary)_22%,transparent)]"
            style={{ backgroundColor: hex, color: contrast }}
          >
            {hex.toUpperCase()}
          </div>
        </div>
      )}

      <div className="grid gap-6 desktop:grid-cols-[minmax(360px,520px)_minmax(220px,1fr)] desktop:items-end">
        <div
          className={cn(
            "grid gap-5",
            "[&_.react-colorful]:h-auto [&_.react-colorful]:w-full",
            "[&_.react-colorful__saturation]:h-80 [&_.react-colorful__saturation]:rounded-xl [&_.react-colorful__saturation]:border-0",
            "[&_.react-colorful__hue]:mt-4 [&_.react-colorful__hue]:h-5 [&_.react-colorful__hue]:rounded-full",
            "[&_.react-colorful__interactive]:outline-none",
            "[&_.react-colorful__pointer]:size-7 [&_.react-colorful__pointer]:border-2 [&_.react-colorful__pointer]:border-white [&_.react-colorful__pointer]:shadow-[0_0_0_1px_rgb(0_0_0/0.45),0_8px_24px_rgb(0_0_0/0.35)]",
          )}
        >
          <HexColorPicker color={hex} onChange={(next) => onChange(next)} />
        </div>

        <div className="grid gap-5">
          {presets.length > 0 ? (
            <div className="grid gap-2">
              <Label>Quick colors</Label>
              <div className="flex flex-wrap gap-3">
                {presets.map((preset) => {
                  const presetHex = normalizeHex(preset.color);

                  return (
                    <button
                      key={`${preset.name}-${preset.color}`}
                      type="button"
                      onClick={() => onChange(presetHex)}
                      className={cn(
                        "group grid size-12 place-items-center rounded-full border border-white/15 shadow-sm transition-transform hover:scale-105",
                        presetHex === hex &&
                          "ring-2 ring-ring ring-offset-2 ring-offset-background",
                      )}
                      style={{ backgroundColor: presetHex }}
                      aria-label={`Use ${preset.name}`}
                      title={preset.name}
                    >
                      <span className="size-2 rounded-full bg-white/0 transition-colors group-hover:bg-white/70" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 desktop:grid-cols-[44px_1fr_auto] desktop:items-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 rounded-xl"
              onClick={async () => {
                const eyeDropper = getEyeDropper();
                if (!eyeDropper) return;
                const result = await eyeDropper.open();
                onChange(normalizeHex(result.sRGBHex));
              }}
              disabled={!canUseEyeDropper}
              aria-label="Pick color from screen"
            >
              <Icons.Actions.Eyedropper size={20} />
            </Button>

            <div className="grid gap-2">
              <Label>Hex code</Label>
              <div className="relative">
                <span className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 font-mono text-sm text-muted-foreground">
                  #
                </span>
                <HexColorInput
                  color={hex}
                  onChange={(next) => onChange(normalizeHex(next))}
                  prefixed={false}
                  aria-label="Hex code"
                  className="h-11 w-full rounded-xl border border-input bg-background/60 px-3 py-1 pl-7 font-mono text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
                />
              </div>
            </div>

            {actionLabel && onAction ? (
              <Button
                type="button"
                className="h-11 rounded-xl px-6"
                style={{ backgroundColor: hex, color: contrast }}
                onClick={() => onAction(hex)}
              >
                {actionLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function normalizeHex(value: string) {
  const clean = value
    .trim()
    .replace(/^#/, "")
    .replace(/[^a-fA-F0-9]/g, "");
  const expanded =
    clean.length === 3
      ? clean
          .split("")
          .map((character) => `${character}${character}`)
          .join("")
      : clean;
  const padded = expanded.padEnd(6, "0").slice(0, 6);
  return `#${padded}`;
}

function getContrastColor(hex: string) {
  const normalized = normalizeHex(hex);
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.5 ? "#0b0d10" : "#ffffff";
}

function getEyeDropper(): { open: () => Promise<{ sRGBHex: string }> } | null {
  if (typeof window === "undefined") return null;
  const ctor = (
    window as Window & {
      EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
    }
  ).EyeDropper;
  return ctor ? new ctor() : null;
}
