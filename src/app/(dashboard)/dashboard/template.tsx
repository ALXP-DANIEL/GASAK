"use client";

import { motion, useReducedMotion } from "motion/react";

/** Re-mounts on every navigation, giving each dashboard page an entrance. */
export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 0.65, 0.3, 0.9] }}
    >
      {children}
    </motion.div>
  );
}
