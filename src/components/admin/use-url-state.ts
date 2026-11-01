"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Local state seeded from a `?param=` and re-synced whenever the URL value changes
 * (e.g. arriving from a link while the page is already mounted). Must be used under <Suspense>.
 */
export function useUrlState(name: string, fallback = ""): [string, (value: string) => void] {
  const params = useSearchParams();
  const urlValue = params.get(name) ?? fallback;
  const [prevUrl, setPrevUrl] = useState(urlValue);
  const [value, setValue] = useState(urlValue);
  if (urlValue !== prevUrl) {
    setPrevUrl(urlValue);
    setValue(urlValue);
  }
  return [value, setValue];
}

/** Like `useUrlState` but constrained to a known set of values. */
export function useUrlEnum<T extends string>(
  name: string,
  allowed: readonly T[],
  fallback: T,
): [T, (value: T) => void] {
  const [raw, setRaw] = useUrlState(name, fallback);
  const value = (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
  return [value, (next: T) => setRaw(next)];
}
