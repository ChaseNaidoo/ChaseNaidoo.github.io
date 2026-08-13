import { useEffect, useRef, useState } from "react";

import { useCarouselEdgeCursor } from "./useCarouselEdgeCursor.js";

const IDLE_MS = 4500;
const SWIPE_THRESHOLD = 42;

export default function StudyVisualCarousel({ slides, label = "Product screens" }) {
  const shotRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, dx: 0, pointerId: null });
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const active = slides[index] ?? slides[0];
  const count = slides.length;

  const go = (dir) => {
    if (count < 2) return;
    setIndex((current) => (current + dir + count) % count);
  };

  useCarouselEdgeCursor(shotRef, {
    enabled: count > 1,
    canGoLeft: true,
    canGoRight: true,
    onEdgeClick: (edge) => go(edge === "left" ? -1 : 1),
    stealEdgeClicks: true
  });

  useEffect(() => {
    slides.forEach((slide) => {
      const img = new Image();
      img.src = slide.src;
    });
  }, [slides]);

  useEffect(() => {
    if (paused || count < 2) return undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return undefined;

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, IDLE_MS);

    return () => window.clearInterval(id);
  }, [paused, count]);

  if (!active) return null;

  const onPointerDown = (event) => {
    if (count < 2) return;
    dragRef.current = {
      active: true,
      startX: event.clientX,
      dx: 0,
      pointerId: event.pointerId
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag.active || event.pointerId !== drag.pointerId) return;
    drag.dx = event.clientX - drag.startX;
  };

  const endPointer = (event) => {
    const drag = dragRef.current;
    if (!drag.active || (event.pointerId != null && event.pointerId !== drag.pointerId)) return;
    const dx = drag.dx;
    drag.active = false;
    drag.pointerId = null;
    if (Math.abs(dx) >= SWIPE_THRESHOLD) {
      go(dx < 0 ? 1 : -1);
      setPaused(true);
    }
  };

  return (
    <div
      className="study-visual-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div
        ref={shotRef}
        className="study-shot study-shot--carousel"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        {slides.map((slide, i) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            className={slide.shotClass || undefined}
            aria-hidden={i !== index}
            data-active={i === index ? "true" : "false"}
            draggable={false}
          />
        ))}
      </div>

      <div className="study-visual-carousel-bar">
        <p key={active.caption} className="study-visual-carousel-caption">
          {active.caption}
        </p>
        <div className="study-visual-carousel-ticks" role="tablist" aria-label="Screens">
          {slides.map((slide, i) => (
            <button
              key={slide.caption}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={slide.caption}
              className={`study-visual-carousel-tick${i === index ? " is-active" : ""}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
