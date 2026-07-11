"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

/**
 * Scoreboard-style count-up. Server-renders the final value (so no-JS and
 * SEO see the real number), then counts up from zero once scrolled into view.
 */
export function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView || reduceMotion) return;
    const controls = animate(0, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = Math.round(latest).toLocaleString("en-MY");
      },
    });
    return () => controls.stop();
  }, [value, inView, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString("en-MY")}
    </span>
  );
}
