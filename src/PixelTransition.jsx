import { useEffect, useMemo, useState } from "react";

const COVER_MS = 520;
const REVEAL_MS = 460;
const STAGGER_MS = 32;
const WHITE = { r: 255, g: 255, b: 255 };

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useSlatCount() {
  const [count, setCount] = useState(22);

  useEffect(() => {
    const sync = () => {
      const w = window.innerWidth;
      if (w < 480) setCount(9);
      else if (w < 768) setCount(12);
      else if (w < 1100) setCount(16);
      else setCount(22);
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return count;
}

function parseHex(hex) {
  const n = hex.replace("#", "");
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16)
  };
}

/** Mix white toward a brand accent (0 = white, 1 = full brand). */
function mixWhite(hex, amount) {
  const c = parseHex(hex);
  const mix = (from, to) => Math.round(from + (to - from) * amount);
  return `rgb(${mix(WHITE.r, c.r)}, ${mix(WHITE.g, c.g)}, ${mix(WHITE.b, c.b)})`;
}

function shadeForIndex(i, total, accent) {
  const t = total <= 1 ? 1 : i / (total - 1);
  return mixWhite(accent, t);
}

/**
 * Diagonal vertical-slat curtain.
 * Forward: left → right from the top. Back: right → left from the bottom.
 */
export default function PixelTransition({ phase, direction = "forward", onCovered, onRevealed }) {
  const active = phase !== "idle";
  const slatCount = useSlatCount();

  const slats = useMemo(() => {
    const accent = direction === "back" ? "#5200ff" : "#c2fe0c";
    return Array.from({ length: slatCount }, (_, i) => {
      const axis = direction === "back" ? slatCount - 1 - i : i;
      return {
        key: i,
        delay: axis * STAGGER_MS,
        shade: shadeForIndex(axis, slatCount, accent)
      };
    });
  }, [direction, slatCount]);

  useEffect(() => {
    if (phase === "idle") return undefined;

    if (prefersReducedMotion()) {
      const t = window.setTimeout(() => {
        if (phase === "cover") onCovered?.();
        else onRevealed?.();
      }, 40);
      return () => window.clearTimeout(t);
    }

    const maxDelay = (slatCount - 1) * STAGGER_MS;
    const duration = (phase === "cover" ? COVER_MS : REVEAL_MS) + maxDelay;
    const t = window.setTimeout(() => {
      if (phase === "cover") onCovered?.();
      else onRevealed?.();
    }, duration);

    return () => window.clearTimeout(t);
  }, [phase, slatCount, onCovered, onRevealed]);

  return (
    <div
      className={`slat-transition${active ? " is-active" : ""} slat-transition--${phase} slat-transition--${direction}`}
      aria-hidden="true"
    >
      <div className="slat-transition-row">
        {slats.map((slat) => (
          <div
            key={slat.key}
            className="slat-transition-slat"
            style={{
              "--stagger": `${slat.delay}ms`,
              background: slat.shade
            }}
          />
        ))}
      </div>
    </div>
  );
}
