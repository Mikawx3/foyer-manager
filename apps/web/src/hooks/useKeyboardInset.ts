import { useEffect, useState } from "react";

export function getKeyboardInset(): number {
  const viewport = window.visualViewport;
  if (!viewport) {
    return 0;
  }
  return Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
}

export function useKeyboardInset(): { keyboardInset: number } {
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    const updateInset = () => {
      setKeyboardInset(getKeyboardInset());
    };

    updateInset();
    viewport.addEventListener("resize", updateInset);
    viewport.addEventListener("scroll", updateInset);

    return () => {
      viewport.removeEventListener("resize", updateInset);
      viewport.removeEventListener("scroll", updateInset);
    };
  }, []);

  return { keyboardInset };
}
