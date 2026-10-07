import { useEffect, useRef, useState } from "react";
import { getCarouselArrow, isHeroPlusCursorActive } from "./cursorInteractive.js";

const INTERACTIVE_SELECTOR =
  "a, button, [role='button'], [role='slider'], [role='tab'], input, textarea, select, label[for], summary, .ba-slider";
const BASE_DIAMETER = 18;
const HOVER_SCALE = 2.35;

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const posRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const domHoverRef = useRef(false);
  const visibleRef = useRef(false);
  const rafRef = useRef(0);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mqFine = window.matchMedia("(pointer: fine)");
    const sync = () => {
      const on = mqFine.matches;
      setEnabled(on);
      document.documentElement.classList.toggle("custom-cursor-active", on);
    };
    sync();
    mqFine.addEventListener("change", sync);
    return () => {
      mqFine.removeEventListener("change", sync);
      document.documentElement.classList.remove("custom-cursor-active");
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    const paint = () => {
      cursor.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) translate(-50%, -50%) scale(${scaleRef.current})`;
    };

    const syncHover = () => {
      const arrow = getCarouselArrow();
      const hovering = Boolean(arrow) || domHoverRef.current || isHeroPlusCursorActive();
      scaleRef.current = hovering ? HOVER_SCALE : 1;
      cursor.classList.toggle("custom-cursor--hover", hovering && !arrow);
      cursor.classList.toggle("custom-cursor--arrow", Boolean(arrow));
      cursor.classList.toggle("custom-cursor--arrow-left", arrow === "left");
      cursor.classList.toggle("custom-cursor--arrow-right", arrow === "right");
      paint();
    };

    const onPointerMove = (event) => {
      if (!visibleRef.current) {
        visibleRef.current = true;
        cursor.classList.add("custom-cursor--visible");
      }
      posRef.current.x = event.clientX;
      posRef.current.y = event.clientY;
      syncHover();
    };

    const onPointerLeave = () => {
      visibleRef.current = false;
      domHoverRef.current = false;
      cursor.classList.remove("custom-cursor--visible");
      syncHover();
    };

    const onPointerOver = (event) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest(INTERACTIVE_SELECTOR)) {
        domHoverRef.current = true;
        syncHover();
      }
    };

    const onPointerOut = (event) => {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest(INTERACTIVE_SELECTOR)) return;

      const related = event.relatedTarget;
      if (related instanceof Element && related.closest(INTERACTIVE_SELECTOR)) {
        return;
      }
      domHoverRef.current = false;
      syncHover();
    };

    const tick = () => {
      syncHover();
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointerout", onPointerOut);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      cancelAnimationFrame(rafRef.current);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      className="custom-cursor"
      ref={cursorRef}
      style={{ width: BASE_DIAMETER, height: BASE_DIAMETER }}
      aria-hidden="true"
    >
      <svg className="custom-cursor-arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M6.25 3.5 11 8l-4.75 4.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </svg>
    </div>
  );
}
