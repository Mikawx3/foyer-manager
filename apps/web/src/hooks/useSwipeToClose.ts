import { useCallback, useRef, useState } from "react";

const SWIPE_CLOSE_THRESHOLD = 80;

export function useSwipeToClose(onClose: () => void, enabled = true) {
  const startYRef = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled) {
        return;
      }
      startYRef.current = event.touches[0]?.clientY ?? 0;
      setIsDragging(true);
    },
    [enabled],
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled || !isDragging) {
        return;
      }
      const currentY = event.touches[0]?.clientY ?? 0;
      const delta = Math.max(0, currentY - startYRef.current);
      setDragOffset(delta);
    },
    [enabled, isDragging],
  );

  const handleTouchEnd = useCallback(() => {
    if (!enabled) {
      return;
    }
    if (dragOffset > SWIPE_CLOSE_THRESHOLD) {
      onClose();
    }
    setDragOffset(0);
    setIsDragging(false);
  }, [dragOffset, enabled, onClose]);

  const panelStyle =
    dragOffset > 0
      ? {
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? "none" : "transform 0.2s ease-out",
        }
      : undefined;

  return {
    dragOffset,
    panelStyle,
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
