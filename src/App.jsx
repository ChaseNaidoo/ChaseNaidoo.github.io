import { Suspense, lazy, useEffect, useRef } from "react";

const HeroTitleCanvas = lazy(() => import("./HeroCanvas.jsx"));
import fancamPlaceholder from "../img/feature2.png";
import inlogicPlaceholder from "../img/feature3.png";

const HEADER_SCROLL_FROST_THRESHOLD_PX = 16;

export default function App() {
  const heroRef = useRef(null);
  const workRef = useRef(null);
  const fancamRef = useRef(null);
  const inlogicRef = useRef(null);
  const pageRef = useRef(null);
  const headerRef = useRef(null);
  const scrollProgressRef = useRef({ scrollYPixels: 0, progress: 0 });
  const pointerRafRef = useRef(0);
  const scrollRafRef = useRef(0);
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

  useEffect(() => {
    const clamp01 = (v) => Math.max(0, Math.min(1, v));
    const mix = (a, b, t) => Math.round(a + (b - a) * t);
    const mixColor = (from, to, t) => [
      mix(from[0], to[0], t),
      mix(from[1], to[1], t),
      mix(from[2], to[2], t)
    ];
    const PAPER = [11, 13, 18];
    const SLATE = [41, 50, 79];
    const CYAN = [1, 255, 255];
    const RED = [255, 13, 26];

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
        headerRef.current?.classList.toggle(
          "site-header--scrolled",
          y > HEADER_SCROLL_FROST_THRESHOLD_PX
        );

        const vh = Math.max(window.innerHeight, 1);
        const workY = workRef.current?.offsetTop ?? heroHeight;
        const fancamY = fancamRef.current?.offsetTop ?? workY + vh;
        const inlogicY = inlogicRef.current?.offsetTop ?? fancamY + vh;

        let rgb = PAPER;
        const introT = clamp01((y - (workY - vh * 0.7)) / (vh * 0.85));
        rgb = mixColor(PAPER, SLATE, introT);

        if (y >= fancamY - vh * 0.5) {
          const t = clamp01((y - (fancamY - vh * 0.5)) / (vh * 0.9));
          rgb = mixColor(SLATE, CYAN, t);
        }
        if (y >= inlogicY - vh * 0.5) {
          const t = clamp01((y - (inlogicY - vh * 0.5)) / (vh * 0.9));
          rgb = mixColor(CYAN, RED, t);
        }

        if (pageRef.current) {
          pageRef.current.style.setProperty("--page-r", String(rgb[0]));
          pageRef.current.style.setProperty("--page-g", String(rgb[1]));
          pageRef.current.style.setProperty("--page-b", String(rgb[2]));
        }
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

  return (
    <div className="page" ref={pageRef} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
      <header className="site-header" ref={headerRef}>
        <nav className="nav-frame">
          <a className="brand glass-pill-hover" href="#top">
            cameron
          </a>
          <ul>
            <li><a className="glass-pill-hover" href="#work">Case Studies</a></li>
            <li><a className="glass-pill-hover" href="#about">About</a></li>
            <li><a className="glass-pill-hover" href="#contact">Contact</a></li>
          </ul>
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
              <a href="#work" className="scroll-cta-link glass-pill-hover">
                <span className="scroll-cta-indicator" aria-hidden="true">
                  <span className="scroll-cta-mouse">
                    <span className="scroll-cta-dot" />
                  </span>
                </span>
                <span className="scroll-cta-label">Case Studies</span>
                <span className="sr-only">Scroll down to Case Studies</span>
              </a>
            </section>
          </div>
        </section>

        <section id="work" className="content-section case-studies-overview" ref={workRef}>
          <h2>Case Studies</h2>
          <p>Product design work focused on user outcomes, system constraints, and measurable impact.</p>
        </section>

        <section id="fancam" className="content-section case-study-section case-study-fancam" ref={fancamRef}>
          <div className="case-study-split">
            <aside className="case-study-rail">
              <p className="case-study-vertical">Case Study</p>
              <p className="project-kicker">Fancam | Front-end Developer | 2025-Present</p>
              <h3>Fancam UX Modernization</h3>
              <p>
                Led end-to-end redesign of the viewing and engagement experience for high-resolution 360deg stadium imagery while
                retaining existing architecture constraints.
              </p>
              <div className="project-meta" aria-label="Case study focus areas">
                <span>UX Strategy</span>
                <span>Interaction Design</span>
                <span>Conversion</span>
              </div>
              <ul className="project-points">
                <li>Mapped user pain points and prioritized high-friction flows affecting exploration and lead capture.</li>
                <li>Designed and validated new interaction patterns, visual hierarchy, and responsive behavior for crowded scenes.</li>
                <li>Partnered across product and engineering to ship iterative UI updates with minimal platform disruption.</li>
              </ul>
              <p className="project-result">Outcome: higher engagement per user and improved lead quality from core user journeys.</p>
              <div className="case-study-actions">
                <a href="#contact" className="case-study-btn">View process</a>
                <a href="#contact" className="case-study-btn case-study-btn-secondary">Open prototype</a>
              </div>
            </aside>
            <div className="case-study-visual">
              <img src={fancamPlaceholder} alt="Fancam case study placeholder visual" loading="lazy" />
            </div>
          </div>
        </section>

        <section id="inlogic" className="content-section case-study-section case-study-inlogic" ref={inlogicRef}>
          <div className="case-study-split">
            <aside className="case-study-rail">
              <p className="case-study-vertical">Case Study</p>
              <p className="project-kicker">InLogic | AI & Business Automation Associate | 2024-2025</p>
              <h3>AI Automation Workflow Experience</h3>
              <p>
                Designed user-centered interfaces for AI-powered automation products helping business teams adopt new workflows with
                less operational friction.
              </p>
              <div className="project-meta" aria-label="Case study focus areas">
                <span>Workflow UX</span>
                <span>Information Architecture</span>
                <span>Adoption</span>
              </div>
              <ul className="project-points">
                <li>Translated consulting discovery into clear user flows, information architecture, and interface requirements.</li>
                <li>Designed front-end experiences that made complex automation states understandable and actionable.</li>
                <li>Balanced usability with business constraints by collaborating closely with engineering on implementation trade-offs.</li>
              </ul>
              <p className="project-result">Outcome: improved process efficiency and stronger day-to-day usability for internal stakeholders.</p>
              <div className="case-study-actions">
                <a href="#contact" className="case-study-btn">View process</a>
                <a href="#contact" className="case-study-btn case-study-btn-secondary">Open prototype</a>
              </div>
            </aside>
            <div className="case-study-visual">
              <img src={inlogicPlaceholder} alt="InLogic case study placeholder visual" loading="lazy" />
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
