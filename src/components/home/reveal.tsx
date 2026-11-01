"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** Subtle fade/slide-in when scrolled into view (disabled for reduced-motion users). */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.3, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
