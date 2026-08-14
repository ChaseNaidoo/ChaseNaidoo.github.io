import { useEffect, useRef, useState } from "react";

const AUTO_FROM = 86;
const AUTO_TO = 18;
const AUTO_DELAY_MS = 700;
const AUTO_DURATION_MS = 1800;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  beforeLabel = "Before",
  afterLabel = "After"
}) {
  const frameRef = useRef(null);
  const draggingRef = useRef(false);
  const userLockedRef = useRef(false);
  const [position, setPosition] = useState(AUTO_FROM);
  const [dragging, setDragging] = useState(false);

  const setFromClientX = (clientX) => {
    const frame = frameRef.current;
    if (!frame) return;
    const { left, width } = frame.getBoundingClientRect();
    const next = ((clientX - left) / width) * 100;
    setPosition(Math.min(100, Math.max(0, next)));
  };

  useEffect(() => {
    if (prefersReducedMotion()) {
      setPosition(50);
      userLockedRef.current = true;
      return undefined;
    }

    let raf = 0;
    let startTime = 0;
    const delay = window.setTimeout(() => {
      const tick = (now) => {
        if (userLockedRef.current) return;
        if (!startTime) startTime = now;
        const t = Math.min(1, (now - startTime) / AUTO_DURATION_MS);
        setPosition(AUTO_FROM + (AUTO_TO - AUTO_FROM) * easeInOutCubic(t));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, AUTO_DELAY_MS);

    return () => {
      window.clearTimeout(delay);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const onMove = (event) => {
      if (!draggingRef.current) return;
      setFromClientX(event.clientX);
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setDragging(false);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const lockAndSet = (clientX) => {
    userLockedRef.current = true;
    setFromClientX(clientX);
  };

  const onPointerDown = (event) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    event.preventDefault();
    draggingRef.current = true;
    setDragging(true);
    lockAndSet(event.clientX);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onKeyDown = (event) => {
    const step = event.shiftKey ? 10 : 4;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      userLockedRef.current = true;
      setPosition((value) => Math.max(0, value - step));
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      userLockedRef.current = true;
      setPosition((value) => Math.min(100, value + step));
    }
    if (event.key === "Home") {
      event.preventDefault();
      userLockedRef.current = true;
      setPosition(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      userLockedRef.current = true;
      setPosition(100);
    }
  };

  return (
    <div
      ref={frameRef}
      className={`ba-slider${dragging ? " is-dragging" : ""}`}
      role="group"
      aria-label={`${beforeLabel} and ${afterLabel} comparison. ${beforeAlt}. ${afterAlt}.`}
      onPointerDown={onPointerDown}
    >
      <img className="ba-slider-img ba-slider-img--after" src={afterSrc} alt="" />
      <div
        className="ba-slider-before"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img className="ba-slider-img" src={beforeSrc} alt="" />
      </div>

      <span className="ba-slider-tag ba-slider-tag--before">{beforeLabel}</span>
      <span className="ba-slider-tag ba-slider-tag--after">{afterLabel}</span>

      <div
        className="ba-slider-handle"
        style={{ left: `${position}%` }}
        role="slider"
        tabIndex={0}
        aria-label="Reveal after design"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={`${Math.round(position)}% before, ${Math.round(100 - position)}% after`}
        onKeyDown={onKeyDown}
      >
        <span className="ba-slider-line" aria-hidden="true" />
        <span className="ba-slider-knob" aria-hidden="true" />
      </div>
    </div>
  );
}
