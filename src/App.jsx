import { Suspense, lazy, useEffect, useRef } from "react";

const HeroTitleCanvas = lazy(() => import("./HeroCanvas.jsx"));

const HEADER_SCROLL_FROST_THRESHOLD_PX = 16;

export default function App() {
  const heroRef = useRef(null);
  const pageRef = useRef(null);
  const headerRef = useRef(null);
  const scrollProgressRef = useRef({ scrollYPixels: 0, progress: 0 });

  useEffect(() => {
    const onScroll = () => {
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
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const handlePointerMove = (event) => {
    if (!pageRef.current) return;
    pageRef.current.style.setProperty("--grid-hover", "1");
    pageRef.current.style.setProperty("--mouse-x", `${event.clientX}px`);
    pageRef.current.style.setProperty("--mouse-y", `${event.clientY}px`);
  };

  const handlePointerLeave = () => {
    if (!pageRef.current) return;
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
            <li><a className="glass-pill-hover" href="#projects">Fun Projects</a></li>
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

            <section id="work" className="scroll-cta-section" aria-label="Scroll to projects">
              <a href="#projects" className="scroll-cta-link glass-pill-hover">
                <span className="scroll-cta-indicator" aria-hidden="true">
                  <span className="scroll-cta-mouse">
                    <span className="scroll-cta-dot" />
                  </span>
                </span>
                <span className="scroll-cta-label">Projects</span>
                <span className="sr-only">Scroll down to Fun Projects</span>
              </a>
            </section>
          </div>
        </section>

        <section id="projects" className="content-section">
          <h2>Fun Projects</h2>
          <p>Experimental prototypes exploring 3D interface motifs, motion language, and glass-style rendering.</p>
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
