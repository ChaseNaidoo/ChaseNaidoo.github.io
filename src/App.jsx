import { Suspense, lazy, useEffect, useRef, useState } from "react";

import CustomCursor from "./CustomCursor.jsx";

const HeroTitleCanvas = lazy(() => import("./HeroCanvas.jsx"));
import fancamPlaceholder from "../img/feature2.png";
import inlogicPlaceholder from "../img/feature3.png";

const CASE_STUDIES = [
  {
    id: "fancam",
    index: "01",
    client: "Fancam",
    period: "2025–Present",
    title: "Fancam UX Modernization",
    lede:
      "Led end-to-end redesign of the viewing and engagement experience for high-resolution 360° stadium imagery while retaining existing architecture constraints.",
    image: fancamPlaceholder,
    imageAlt: "Fancam case study placeholder visual",
    github: null,
    live: null
  },
  {
    id: "inlogic",
    index: "02",
    client: "InLogic",
    period: "2024–2025",
    title: "AI Automation Workflow Experience",
    lede:
      "Designed user-centered interfaces for AI-powered automation products helping business teams adopt new workflows with less operational friction.",
    image: inlogicPlaceholder,
    imageAlt: "InLogic case study placeholder visual",
    github: null,
    live: null
  }
];

function caseStudyHref(id) {
  return `/case-studies/${id}`;
}

export default function App() {
  const heroRef = useRef(null);
  const pageRef = useRef(null);
  const scrollProgressRef = useRef({ scrollYPixels: 0, progress: 0 });
  const pointerRafRef = useRef(0);
  const scrollRafRef = useRef(0);
  const pointerPosRef = useRef({ x: 0, y: 0 });
  const canUseGridHoverRef = useRef(true);
  const cardsTrackRef = useRef(null);
  const skipCarouselScrollRef = useRef(true);
  const [activeStudyId, setActiveStudyId] = useState(CASE_STUDIES[0].id);

  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash.slice(1);
      if (CASE_STUDIES.some((study) => study.id === hash)) {
        setActiveStudyId(hash);
      }
    };

    const hash = window.location.hash.slice(1);
    if (CASE_STUDIES.some((study) => study.id === hash)) {
      setActiveStudyId(hash);
      window.scrollTo(0, 0);
    }

    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    const track = cardsTrackRef.current;
    const card = track?.querySelector(`[data-study-id="${activeStudyId}"]`);
    if (!track || !card) return;

    if (skipCarouselScrollRef.current) {
      skipCarouselScrollRef.current = false;
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scrollLeft = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
    track.scrollTo({
      left: Math.max(0, scrollLeft),
      behavior: reducedMotion ? "auto" : "smooth"
    });
  }, [activeStudyId]);

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

  useEffect(() => {
    const onScroll = () => {
      if (scrollRafRef.current) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = 0;
        const y = window.scrollY;
        const heroHeight = heroRef.current?.offsetHeight ?? 1;
        const progress = Math.min(1.2, Math.max(0, y / heroHeight));
        scrollProgressRef.current = {
          scrollYPixels: y,
          progress
        };
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
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

  const activeIndex = Math.max(
    0,
    CASE_STUDIES.findIndex((study) => study.id === activeStudyId)
  );
  const activeStudy = CASE_STUDIES[activeIndex] ?? CASE_STUDIES[0];

  const selectStudy = (id) => {
    setActiveStudyId(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  const stepStudy = (direction) => {
    const nextIndex = (activeIndex + direction + CASE_STUDIES.length) % CASE_STUDIES.length;
    selectStudy(CASE_STUDIES[nextIndex].id);
  };

  return (
    <div className="page" ref={pageRef} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
      <CustomCursor />
      <header className="site-header">
        <nav className="nav-pill glass-chrome" aria-label="Site navigation">
          <a className="nav-pill-link nav-pill-brand" href="#top">
            cameron
          </a>
          <span className="nav-pill-divider" aria-hidden="true" />
          <a className="nav-pill-link" href="#work">
            Case Studies
          </a>
          <a className="nav-pill-link" href="#about">
            About
          </a>
          <a className="nav-pill-link" href="#contact">
            Contact
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" ref={heroRef}>
          <div className="hero-bloom" />

          <div className="hero-canvas-shell">
            <div className="hero-title-stage">
              <h1 className="hero-title sr-only">
                DESIGN THAT
                <br />
                ELEVATES
                <br />
                YOUR
                <br />
                AI PRODUCTS
              </h1>
              <Suspense
                fallback={
                  <div
                    className="hero-title-canvas hero-title-canvas--loading"
                    aria-hidden
                  />
                }
              >
                <HeroTitleCanvas scrollRef={scrollProgressRef} />
              </Suspense>
            </div>

            <section className="scroll-cta-section" aria-label="Scroll to case studies">
              <a href="#work" className="scroll-cta-link glass-chrome">
                <span className="scroll-cta-indicator" aria-hidden="true">
                  <span className="scroll-cta-arrows">
                    <svg className="scroll-cta-arrow" viewBox="0 0 16 6" fill="none">
                      <path
                        d="M1 1.25 8 5.25 15 1.25"
                        stroke="currentColor"
                        strokeWidth="1.25"
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                      />
                    </svg>
                    <svg className="scroll-cta-arrow" viewBox="0 0 16 6" fill="none">
                      <path
                        d="M1 1.25 8 5.25 15 1.25"
                        stroke="currentColor"
                        strokeWidth="1.25"
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                      />
                    </svg>
                  </span>
                </span>
                <span className="scroll-cta-label">Scroll</span>
                <span className="sr-only">Scroll down to case studies</span>
              </a>
            </section>
          </div>
        </section>

        <section id="work" className="case-studies-section" aria-labelledby="case-studies-showcase-title">
          <div className="case-studies-shell">
            <aside className="case-studies-rail" aria-hidden="true">
              <span className="case-studies-rail-label">Case Studies</span>
              <span className="case-studies-rail-count">{String(CASE_STUDIES.length).padStart(2, "0")} Projects</span>
            </aside>

            <div className="case-studies-main">
              <div className="case-studies-showcase">
                <img
                  key={activeStudy.id}
                  src={activeStudy.image}
                  alt={activeStudy.imageAlt}
                  loading="lazy"
                />

                <div className="case-studies-showcase-overlay">
                  <div className="case-studies-progress" aria-hidden="true">
                    {CASE_STUDIES.map((study, index) => (
                      <span
                        key={study.id}
                        className={index === activeIndex ? "is-active" : undefined}
                      />
                    ))}
                  </div>

                  <p className="case-studies-showcase-kicker">
                    {activeStudy.client}
                    <span aria-hidden="true"> / </span>
                    {activeStudy.period}
                  </p>

                  <h2 id="case-studies-showcase-title" className="case-studies-showcase-title">
                    {activeStudy.title}
                  </h2>

                  <p className="case-studies-showcase-desc">{activeStudy.lede}</p>

                  <div className="case-studies-showcase-actions">
                    <a
                      href={caseStudyHref(activeStudy.id)}
                      className="case-studies-action case-studies-action--primary"
                    >
                      Case study <span aria-hidden="true">[↗]</span>
                    </a>
                    {activeStudy.github ? (
                      <a
                        href={activeStudy.github}
                        className="case-studies-action"
                        target="_blank"
                        rel="noreferrer"
                      >
                        GitHub <span aria-hidden="true">[↗]</span>
                      </a>
                    ) : null}
                    {activeStudy.live ? (
                      <a
                        href={activeStudy.live}
                        className="case-studies-action"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Live <span aria-hidden="true">[↗]</span>
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="case-studies-showcase-nav">
                  <button
                    type="button"
                    className="case-studies-nav-btn"
                    aria-label="Previous project"
                    onClick={() => stepStudy(-1)}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="case-studies-nav-btn"
                    aria-label="Next project"
                    onClick={() => stepStudy(1)}
                  >
                    →
                  </button>
                </div>
              </div>

              <div className="case-studies-cards-wrap">
                <div
                  ref={cardsTrackRef}
                  className="case-studies-cards"
                  role="tablist"
                  aria-label="Case study projects"
                >
                {CASE_STUDIES.map((study) => {
                  const isActive = activeStudyId === study.id;

                  return (
                    <div
                      key={study.id}
                      data-study-id={study.id}
                      className={`case-studies-card${isActive ? " is-active" : ""}`}
                      role="presentation"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className="case-studies-card-select"
                        onClick={() => selectStudy(study.id)}
                      >
                        <span className="case-studies-thumb">
                          <img src={study.image} alt="" loading="lazy" />
                        </span>
                        <span className="case-studies-card-copy">
                          <span className="case-studies-index">{study.index}</span>
                          <span className="case-studies-title">{study.title}</span>
                          <span className="case-studies-meta">
                            {study.client}
                            <span aria-hidden="true"> / </span>
                            {study.period}
                          </span>
                        </span>
                      </button>
                      <a
                        href={caseStudyHref(study.id)}
                        className="case-studies-toggle"
                        aria-label={`Open ${study.title} case study page`}
                      >
                        [+]
                      </a>
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="content-section">
          <h2>About</h2>
          <p>Product-minded front-end developer combining strong UI craft with practical engineering execution.</p>
        </section>

        <section id="contact" className="content-section">
          <h2>Contact</h2>
          <p>chasenaidoo9@gmail.com</p>
        </section>
      </main>
    </div>
  );
}
