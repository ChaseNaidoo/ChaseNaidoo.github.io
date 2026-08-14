import { useEffect, useRef } from "react";

import CustomCursor from "./CustomCursor.jsx";

export default function PageFrame({ children, className = "" }) {
  const pageRef = useRef(null);
  const pointerRafRef = useRef(0);
  const pointerPosRef = useRef({ x: 0, y: 0 });
  const canUseGridHoverRef = useRef(true);

  useEffect(() => {
    const mqCoarse = window.matchMedia("(pointer: coarse)");
    const syncHoverCapability = () => {
      const canUse = !mqCoarse.matches;
      canUseGridHoverRef.current = canUse;
      if (!canUse && pageRef.current) {
        pageRef.current.style.setProperty("--grid-hover", "0");
      }
    };
    syncHoverCapability();
    mqCoarse.addEventListener("change", syncHoverCapability);
    return () => mqCoarse.removeEventListener("change", syncHoverCapability);
  }, []);

  useEffect(() => {
    return () => {
      if (pointerRafRef.current) {
        cancelAnimationFrame(pointerRafRef.current);
      }
    };
  }, []);

  const handlePointerMove = (event) => {
    if (!pageRef.current || !canUseGridHoverRef.current) return;
    pointerPosRef.current.x = event.clientX;
    pointerPosRef.current.y = event.clientY;
    if (pointerRafRef.current) return;
    pointerRafRef.current = requestAnimationFrame(() => {
      pointerRafRef.current = 0;
      if (!pageRef.current) return;
      pageRef.current.style.setProperty("--grid-hover", "1");
      pageRef.current.style.setProperty("--mouse-x", `${pointerPosRef.current.x}px`);
      pageRef.current.style.setProperty("--mouse-y", `${pointerPosRef.current.y}px`);
    });
  };

  const handlePointerLeave = () => {
    if (!pageRef.current) return;
    if (pointerRafRef.current) {
      cancelAnimationFrame(pointerRafRef.current);
      pointerRafRef.current = 0;
    }
    pageRef.current.style.setProperty("--grid-hover", "0");
  };

  return (
    <div
      className={`page${className ? ` ${className}` : ""}`}
      ref={pageRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <CustomCursor />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {children}
    </div>
  );
}
