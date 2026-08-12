import { useEffect, useState } from "react";

const IDLE_MS = 4500;

export default function StudyVisualCarousel({ slides, label = "Product screens" }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const active = slides[index] ?? slides[0];

  useEffect(() => {
    slides.forEach((slide) => {
      const img = new Image();
      img.src = slide.src;
    });
  }, [slides]);

  useEffect(() => {
    if (paused || slides.length < 2) return undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return undefined;

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, IDLE_MS);

    return () => window.clearInterval(id);
  }, [paused, slides.length]);

  if (!active) return null;

  return (
    <div
      className="study-visual-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div className="study-shot study-shot--carousel">
        {slides.map((slide, i) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            className={slide.shotClass || undefined}
            aria-hidden={i !== index}
            data-active={i === index ? "true" : "false"}
          />
        ))}
      </div>

      <div className="study-visual-carousel-bar">
        <p className="study-visual-carousel-caption">{active.caption}</p>
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
