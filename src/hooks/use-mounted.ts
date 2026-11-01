import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** true on the client after hydration, false during SSR / first hydration render. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
