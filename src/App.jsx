import { Suspense, lazy, useEffect, useRef, useState } from "react";

import { CASE_STUDIES, caseStudyHref } from "./data/caseStudies.js";
import PageFrame from "./PageFrame.jsx";
import SiteHeader from "./SiteHeader.jsx";

const HeroTitleCanvas = lazy(() => import("./HeroCanvas.jsx"));

const CASE_STUDY_IDLE_MS = 8000;

export default function App() {
  const heroRef = useRef(null);
  const workRef = useRef(null);
  const scrollProgressRef = useRef({ scrollYPixels: 0, progress: 0 });
  const scrollRafRef = useRef(0);
  const cardsTrackRef = useRef(null);
  const skipCarouselScrollRef = useRef(true);
  const workInViewRef = useRef(false);
  const idleTimerRef = useRef(0);
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
    const work = workRef.current;
    if (!work) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        workInViewRef.current = entry.isIntersecting && entry.intersectionRatio >= 0.35;
      },
      { threshold: [0, 0.35, 0.6] }
    );
    observer.observe(work);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || CASE_STUDIES.length < 2) return undefined;

    const clearIdle = () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = 0;
      }
    };

    const scheduleIdleAdvance = () => {
      clearIdle();
      idleTimerRef.current = window.setTimeout(() => {
        if (document.hidden || !workInViewRef.current) {
          scheduleIdleAdvance();
          return;
        }
        setActiveStudyId((currentId) => {
          const currentIndex = CASE_STUDIES.findIndex((study) => study.id === currentId);
          const nextIndex = (Math.max(0, currentIndex) + 1) % CASE_STUDIES.length;
          const nextId = CASE_STUDIES[nextIndex].id;
          window.history.replaceState(null, "", `#${nextId}`);
          return nextId;
        });
        scheduleIdleAdvance();
      }, CASE_STUDY_IDLE_MS);
    };

    const onInteract = () => scheduleIdleAdvance();
    const onVisibility = () => {
      if (document.hidden) clearIdle();
      else scheduleIdleAdvance();
    };

    const work = workRef.current;
    work?.addEventListener("pointerdown", onInteract);
    work?.addEventListener("focusin", onInteract);
    work?.addEventListener("wheel", onInteract, { passive: true });
    window.addEventListener("keydown", onInteract);
    document.addEventListener("visibilitychange", onVisibility);
    scheduleIdleAdvance();

    return () => {
      clearIdle();
      work?.removeEventListener("pointerdown", onInteract);
      work?.removeEventListener("focusin", onInteract);
      work?.removeEventListener("wheel", onInteract);
      window.removeEventListener("keydown", onInteract);
      document.removeEventListener("visibilitychange", onVisibility);
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

  const activeIndex = Math.max(
    0,
    CASE_STUDIES.findIndex((study) => study.id === activeStudyId)
  );
  const activeStudy = CASE_STUDIES[activeIndex] ?? CASE_STUDIES[0];

  const selectStudy = (id) => {
    setActiveStudyId(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <PageFrame>
      <SiteHeader />

      <main id="top">
        <section className="hero" ref={heroRef}>
          <div className="hero-bloom" />

          <div className="hero-canvas-shell">
            <div className="hero-title-stage">
              <div className="hero-lede">
                <h1 className="hero-title sr-only">Where art meets engineering</h1>
                <p className="hero-subtitle">Product Design | Front-end developer</p>
              </div>
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

        <section
          id="work"
          ref={workRef}
          className="case-studies-section"
          aria-labelledby="case-studies-showcase-title"
        >
          <div className="case-studies-main">
              <div className="case-studies-showcase">
                <img
                  key={activeStudy.id}
                  src={activeStudy.image}
                  alt={activeStudy.imageAlt}
                  loading="lazy"
                  style={
                    activeStudy.imagePosition
                      ? { objectPosition: activeStudy.imagePosition }
                      : undefined
                  }
                />

                <div className="case-studies-showcase-overlay">
                  <p className="case-studies-showcase-kicker">
                    {activeStudy.client}
                    <span aria-hidden="true"> / </span>
                    {activeStudy.period}
                  </p>

                  <h2 id="case-studies-showcase-title" className="case-studies-showcase-title">
                    {activeStudy.title}
                  </h2>

                  <p className="case-studies-showcase-desc">{activeStudy.lede}</p>

                  {activeStudy.outcome ? (
                    <p className="case-studies-showcase-outcome">
                      <span className="case-studies-showcase-outcome-label">Outcome</span>
                      {activeStudy.outcome}
                    </p>
                  ) : null}

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

                <div
                  className="case-studies-progress"
                  role="tablist"
                  aria-label="Featured projects"
                >
                  {CASE_STUDIES.map((study, index) => (
                    <button
                      key={study.id}
                      type="button"
                      role="tab"
                      aria-selected={index === activeIndex}
                      aria-label={`Show ${study.title}`}
                      className={`case-studies-progress-tick${index === activeIndex ? " is-active" : ""}`}
                      onClick={() => selectStudy(study.id)}
                    />
                  ))}
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
                          <img
                            src={study.image}
                            alt=""
                            loading="lazy"
                            style={
                              study.imagePosition
                                ? { objectPosition: study.imagePosition }
                                : undefined
                            }
                          />
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
        </section>

        <section id="about" className="content-section about-section">
          <div className="about-inner">
            <p className="about-kicker">About</p>
            <h2>Product designer who can ship the interface</h2>
            <p className="about-lede">
              I design AI and product experiences from research through high-fidelity UI — then implement them
              in code. That mix means I can sit with product, talk fluently with engineering, and take ideas
              further than a handoff. Based in Pretoria, South Africa.
            </p>

            <div className="about-grid">
              <article className="about-block">
                <h3>Experience</h3>
                <ul className="about-timeline">
                  <li>
                    <p className="about-role">Product Design &amp; Front-end</p>
                    <p className="about-meta">Fancam / June 2025 – Present</p>
                    <p>
                      Leading the end-to-end UX redesign of Fancam’s live NFL experience — viewer,
                      camera, postcards, and shop — then shipping the interface on existing
                      architecture with engineering.
                    </p>
                  </li>
                  <li>
                    <p className="about-role">Product Design, AI Automation</p>
                    <p className="about-meta">InLogic / November 2024 – June 2025</p>
                    <p>
                      Designed AI product experiences including Balmer Agency’s Business Acceleration
                      Discovery assistant — from conversation flow and information architecture through
                      high-fidelity UI.
                    </p>
                  </li>
                  <li>
                    <p className="about-role">Quality Controller</p>
                    <p className="about-meta">Liwayway Food South Africa / March 2022 – August 2022</p>
                    <p>
                      Validated product performance against standards, monitored process quality, and produced
                      data capture and reporting.
                    </p>
                  </li>
                  <li>
                    <p className="about-role">Laboratory Assistant</p>
                    <p className="about-meta">Tshwane University of Technology / January 2021 – January 2022</p>
                    <p>
                      Prepared and calibrated lab instruments, and supported sample collection, labeling, and
                      documentation for analysis.
                    </p>
                  </li>
                </ul>
              </article>

              <div className="about-side">
                <article className="about-block">
                  <h3>How I work</h3>
                  <ul className="about-list">
                    <li>
                      <p className="about-role">Design first</p>
                      <p className="about-meta">UX strategy, flows, IA, interaction, visual hierarchy</p>
                    </li>
                    <li>
                      <p className="about-role">Build when it matters</p>
                      <p className="about-meta">React, HTML/CSS, prototypes that survive engineering</p>
                    </li>
                    <li>
                      <p className="about-role">Ship with constraints</p>
                      <p className="about-meta">Existing architecture, AI workflows, measurable outcomes</p>
                    </li>
                  </ul>
                </article>

                <article className="about-block">
                  <h3>Education</h3>
                  <ul className="about-list">
                    <li>
                      <p className="about-role">National Diploma: Biotechnology</p>
                      <p className="about-meta">Tshwane University of Technology / 2022</p>
                    </li>
                    <li>
                      <p className="about-role">Full-stack Software Engineering</p>
                      <p className="about-meta">ALX Africa / 2024</p>
                    </li>
                    <li>
                      <p className="about-role">AI Starter Kit</p>
                      <p className="about-meta">ALX Africa / 2025</p>
                    </li>
                  </ul>
                </article>

                <article className="about-block">
                  <h3>Tools</h3>
                  <ul className="about-skills">
                    <li>Figma</li>
                    <li>UX strategy</li>
                    <li>Interaction design</li>
                    <li>Information architecture</li>
                    <li>React</li>
                    <li>JavaScript</li>
                    <li>HTML / CSS</li>
                    <li>Python</li>
                    <li>n8n</li>
                    <li>SQL</li>
                  </ul>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="content-section contact-section">
          <p className="about-kicker">Contact</p>
          <h2>Let’s design something that ships</h2>
          <p className="about-lede">Pretoria, South Africa</p>
          <div className="contact-links">
            <a href="mailto:chasenaidoo9@gmail.com">chasenaidoo9@gmail.com</a>
            <a href="https://www.linkedin.com/in/cameron-chase-naidoo/" target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </div>
        </section>
      </main>
    </PageFrame>
  );
}
