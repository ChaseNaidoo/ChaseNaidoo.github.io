import { useEffect, useRef } from "react";
import { clearCarouselArrow, setCarouselArrow } from "./cursorInteractive.js";

const DEFAULT_EDGE = 0.22;

/**
 * Desktop edge affordance for carousels: updates custom cursor arrow + optional click.
 * Mobile swipe should be handled separately on the track.
 */
export function useCarouselEdgeCursor(
  containerRef,
  {
    enabled = true,
    edgeRatio = DEFAULT_EDGE,
    canGoLeft = true,
    canGoRight = true,
    stealEdgeClicks = false,
    onEdgeClick
  } = {}
) {
  const optionsRef = useRef({
    edgeRatio,
    canGoLeft,
    canGoRight,
    stealEdgeClicks,
    onEdgeClick
  });
  optionsRef.current = { edgeRatio, canGoLeft, canGoRight, stealEdgeClicks, onEdgeClick };

  useEffect(() => {
    if (!enabled) return undefined;
    const el = containerRef.current;
    if (!el) return undefined;

    const resolveEdge = (clientX) => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return null;
      const x = (clientX - rect.left) / rect.width;
      const { edgeRatio: ratio, canGoLeft: left, canGoRight: right } = optionsRef.current;
      if (x <= ratio && left) return "left";
      if (x >= 1 - ratio && right) return "right";
      return null;
    };

    const onMove = (event) => {
      if (event.pointerType === "touch") {
        clearCarouselArrow();
        return;
      }
      setCarouselArrow(resolveEdge(event.clientX));
    };

    const onLeave = () => clearCarouselArrow();

    const onClick = (event) => {
      if (event.pointerType === "touch") return;
      const edge = resolveEdge(event.clientX);
      if (!edge) return;
      const handler = optionsRef.current.onEdgeClick;
      if (!handler) return;

      if (!optionsRef.current.stealEdgeClicks && event.target instanceof Element) {
        const interactive = event.target.closest("a, button, [role='button'], [role='tab'], input");
        if (interactive && interactive !== el) return;
      }

      event.preventDefault();
      event.stopPropagation();
      handler(edge);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("click", onClick, true);

    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("click", onClick, true);
      clearCarouselArrow();
    };
  }, [containerRef, enabled]);
}
