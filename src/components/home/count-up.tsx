"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { formatNumber } from "@/lib/format";

interface CountUpProps {
  value: number;
  /** formats the animated number, defaults to a localised integer */
  format?: (n: number) => string;
  durationMs?: number;
}

/**
 * Animated counter. Hydration-safe: the server and first client render both show 0,
 * the animation only starts after the element scrolls into view on the client.
 */
export function CountUp({ value, format = (n) => formatNumber(n), durationMs = 1100 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [animated, setAnimated] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = origin + (value - origin) * eased;
      from.current = current;
      setAnimated(current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduce, value, durationMs]);

  const shown = !inView ? 0 : reduce ? value : animated;
  return <span ref={ref}>{format(Math.round(shown))}</span>;
}
