import { useEffect, useLayoutEffect } from "react";

/** `useLayoutEffect` in the browser, `useEffect` during prerendering (where layout effects never run). */
export const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
