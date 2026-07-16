"use client";

import type { AuthBackdropImage } from "@features/auth-images/queries";
import Image from "next/image";
import { useEffect, useState } from "react";

// Enough square cells to cover the viewport on any screen; extra rows are
// clipped by the overflow-hidden backdrop container.
const TILE_COUNT = 24;

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

type TileState = {
  key: number;
  initialIndex: number;
  delay: number;
  duration: number;
};

export function AuthSideGrid({ slides }: { slides?: AuthBackdropImage[] }) {
  const [pool, setPool] = useState<AuthBackdropImage[]>([]);
  const [tiles, setTiles] = useState<TileState[]>([]);

  useEffect(() => {
    const shuffled = shuffle(slides ?? []);
    setPool(shuffled);
    if (shuffled.length === 0) {
      setTiles([]);
      return;
    }
    setTiles(
      Array.from({ length: TILE_COUNT }, (_, i) => ({
        key: i,
        initialIndex: i % shuffled.length,
        delay: Math.random() * 4000,
        duration: 4000 + Math.random() * 4000,
      })),
    );
  }, [slides]);

  if (tiles.length === 0) {
    return (
      <div
        aria-hidden
        className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklab,var(--primary)_15%,transparent),transparent_55%),radial-gradient(circle_at_80%_80%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_50%)]"
      />
    );
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-background"
    >
      <div className="grid grid-cols-3 content-start gap-3 p-3 desktop:grid-cols-6 desktop:gap-4 desktop:p-6">
        {tiles.map((tile) => (
          <PulseTile
            key={tile.key}
            pool={pool}
            initialIndex={tile.initialIndex}
            priority={tile.key < 6}
            delay={tile.delay}
            duration={tile.duration}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-background/55" />
    </div>
  );
}

function PulseTile({
  pool,
  initialIndex,
  priority,
  delay,
  duration,
}: {
  pool: AuthBackdropImage[];
  initialIndex: number;
  priority: boolean;
  delay: number;
  duration: number;
}) {
  const [index, setIndex] = useState(initialIndex);

  // Swap to a random image at each pulse trough: the interval fires at
  // delay + k * duration, exactly when authGridPulse is at its dimmest.
  useEffect(() => {
    if (pool.length < 2) return;
    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        setIndex(Math.floor(Math.random() * pool.length));
      }, duration);
    }, delay);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [pool, delay, duration]);

  const src = pool[index % pool.length]?.imageUrl;
  if (!src) return null;

  return (
    <div
      className="relative aspect-square overflow-hidden rounded-lg border border-primary/25 bg-card shadow-xs"
      style={{
        animation: `authGridPulse ${duration}ms ease-in-out ${delay}ms infinite both`,
      }}
    >
      <Image
        src={src}
        alt=""
        fill
        priority={priority}
        sizes="(min-width: 768px) 17vw, 33vw"
        className="object-cover"
      />

      {/* Card chrome matching squad/player ContentCardFrame */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-30 size-3 border-l-2 border-t-2 border-primary/40"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 z-30 size-3 border-b-2 border-r-2 border-primary/40"
      />
    </div>
  );
}
