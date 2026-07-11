"use client";

import { cn } from "@lib/utils";
import { motion, useReducedMotion } from "motion/react";
import { Children } from "react";

const EASE = [0.22, 0.65, 0.3, 0.9] as const;

/** Fade-and-rise entrance for a block of server-rendered content. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered entrance for a list or grid — each direct child is wrapped in a
 * Reveal, so pass the layout classes (grid/flex) via `className` and cell
 * sizing via `itemClassName`.
 */
export function Stagger({
  children,
  className,
  itemClassName,
  from = 0,
  step = 0.055,
}: {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
  from?: number;
  step?: number;
}) {
  return (
    <div className={className}>
      {Children.map(children, (child, index) => (
        <Reveal
          delay={from + index * step}
          className={cn("min-w-0", itemClassName)}
        >
          {child}
        </Reveal>
      ))}
    </div>
  );
}
