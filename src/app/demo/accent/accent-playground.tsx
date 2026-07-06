"use client";

import { Accent } from "@components/ui/accent";
import { BrandBadge, BrandCard, LinkButton } from "@components/ui/brand";
import { ColorPicker } from "@components/ui/color-picker";
import { useState } from "react";

const PRESETS = [
  { name: "Gold", color: "#d9a21b" },
  { name: "Blue", color: "#2f80ed" },
  { name: "Purple", color: "#8b5cf6" },
  { name: "Green", color: "#22c55e" },
  { name: "Crimson", color: "#ef4444" },
  { name: "Cyan", color: "#06b6d4" },
];

export function AccentPlayground() {
  const [color, setColor] = useState(PRESETS[0].color);

  return (
    <Accent color={color}>
      <div className="grid gap-8">
        <BrandCard className="p-6" interactive={false}>
          <div className="grid gap-6 desktop:grid-cols-[minmax(240px,0.72fr)_minmax(360px,1fr)] desktop:items-start">
            <div className="grid gap-3">
              <BrandBadge>Live accent</BrandBadge>
              <h2 className="font-heading text-2xl font-bold tracking-wide">
                Pick a squad color
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                This changes scoped CSS variables through the Accent component.
                Components below inherit primary, ring, badge, and progress
                colors without custom props.
              </p>
              <div className="mt-3 grid max-w-64 gap-3 rounded-lg border border-primary/20 bg-background/45 p-4">
                <div
                  className="h-16 rounded-lg border border-primary/35 shadow-[0_0_32px_color-mix(in_oklab,var(--primary)_38%,transparent)]"
                  style={{
                    background: `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 38%, black))`,
                  }}
                  aria-hidden
                />
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="font-mono text-foreground">
                    {color.toUpperCase()}
                  </span>
                  <span>Scoped token</span>
                </div>
              </div>
            </div>

            <ColorPicker
              value={color}
              onChange={setColor}
              presets={PRESETS}
              title="Accent Color"
              description="Pick the squad accent used by badges, rings, buttons, panels, and progress elements."
            />
          </div>
        </BrandCard>

        <section className="grid gap-4 desktop:grid-cols-[1.1fr_0.9fr]">
          <BrandCard className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <BrandBadge>Panel</BrandBadge>
                <h2 className="mt-4 font-heading text-2xl font-bold tracking-wide">
                  GASAK RETAK
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Preview cards, badges, rings, buttons, and bars using the
                  selected accent.
                </p>
              </div>
              <div className="rounded border border-primary/35 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
                {color.toUpperCase()}
              </div>
            </div>

            <div className="mt-6 grid gap-4 mobile:grid-cols-1 desktop:grid-cols-3">
              {[
                ["Members", "10 / 20"],
                ["Win Rate", "66.7%"],
                ["Scrims", "6"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-primary/20 bg-background/45 p-4"
                >
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-2 font-heading text-3xl font-bold">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3">
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-2/3 rounded-full bg-primary" />
              </div>
              <div className="flex flex-wrap gap-2">
                <BrandBadge>Primary badge</BrandBadge>
                <span className="rounded border border-ring px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Focus ring
                </span>
                <span className="rounded bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                  Filled
                </span>
              </div>
            </div>
          </BrandCard>

          <BrandCard className="p-6">
            <BrandBadge>Controls</BrandBadge>
            <div className="mt-5 grid gap-4">
              <input
                placeholder="Focused input preview"
                className="h-10 rounded border border-input bg-background px-3 text-sm outline-none ring-ring/40 focus:ring-2"
              />
              <div className="grid gap-3">
                {[
                  "Practice Session",
                  "Scrim vs Eclipse",
                  "Qualifier Match",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-lg border border-primary/15 bg-background/45 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{item}</p>
                      <p className="text-xs text-muted-foreground">
                        {index === 0 ? "08:00 PM" : "09:00 PM"} · Online
                      </p>
                    </div>
                    <BrandBadge>{index === 2 ? "Tour" : "Live"}</BrandBadge>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <LinkButton href="/demo/accent" variant="solid">
                  Primary
                </LinkButton>
                <LinkButton href="/demo/accent">Outline</LinkButton>
              </div>
            </div>
          </BrandCard>
        </section>

        <BrandCard className="p-6" interactive={false}>
          <h2 className="font-heading text-xl font-bold tracking-wide">
            Example elements
          </h2>
          <div className="mt-5 grid gap-4 desktop:grid-cols-4">
            {["Roster card", "Shop item", "News", "Tournament"].map((title) => (
              <div
                key={title}
                className="rounded-lg border border-primary/20 bg-card p-4"
              >
                <div className="mb-4 size-10 rounded bg-primary/15 text-primary" />
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Accent-aware sample element using shared tokens.
                </p>
              </div>
            ))}
          </div>
        </BrandCard>
      </div>
    </Accent>
  );
}
