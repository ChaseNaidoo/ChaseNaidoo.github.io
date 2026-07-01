import { useEffect, useRef, useState } from "react";
import { isHeroPlusCursorActive } from "./cursorInteractive.js";

const INTERACTIVE_SELECTOR =
  "a, button, [role='button'], input, textarea, select, label[for], summary";
const BASE_DIAMETER = 18;
const HOVER_SCALE = 2.35;
const FOLLOW_LERP = 0.16;
const SCALE_LERP = 0.14;

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef({ current: 1, target: 1 });
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

    const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cursor = cursorRef.current;
    if (!cursor) return;

    const syncHover = () => {
      const hovering = domHoverRef.current || isHeroPlusCursorActive();
      scaleRef.current.target = hovering ? HOVER_SCALE : 1;
      cursor.classList.toggle("custom-cursor--hover", hovering);
    };

    const onPointerMove = (event) => {
      if (!visibleRef.current) {
        currentRef.current.x = event.clientX;
        currentRef.current.y = event.clientY;
        visibleRef.current = true;
        cursor.classList.add("custom-cursor--visible");
      }
      targetRef.current.x = event.clientX;
      targetRef.current.y = event.clientY;
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
      const follow = mqReduced.matches ? 1 : FOLLOW_LERP;
      const scaleEase = mqReduced.matches ? 1 : SCALE_LERP;

      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * follow;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * follow;
      scaleRef.current.current +=
        (scaleRef.current.target - scaleRef.current.current) * scaleEase;

      cursor.style.transform = `translate3d(${currentRef.current.x}px, ${currentRef.current.y}px, 0) translate(-50%, -50%) scale(${scaleRef.current.current})`;

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
    />
  );
}
