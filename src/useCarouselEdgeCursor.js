import { useEffect, useRef } from "react";
import { clearCarouselArrow, setCarouselArrow } from "./cursorInteractive.js";

const DEFAULT_EDGE = 0.22;
const INTERACTIVE_SELECTOR = "a, button, [role='button'], [role='tab'], input";

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

    /** Edge clicks are handed to the nested control instead, so the arrow would lie. */
    const isDeferredTarget = (target) => {
      if (optionsRef.current.stealEdgeClicks) return false;
      if (!(target instanceof Element)) return false;
      const interactive = target.closest(INTERACTIVE_SELECTOR);
      return Boolean(interactive) && interactive !== el;
    };

    const onMove = (event) => {
      if (event.pointerType === "touch" || isDeferredTarget(event.target)) {
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

      if (isDeferredTarget(event.target)) return;

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
