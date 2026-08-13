import { Suspense, lazy, useEffect, useRef, useState } from "react";

import { CASE_STUDIES, caseStudyHref } from "./data/caseStudies.js";

const ContactCanvas = lazy(() => import("./ContactCanvas.jsx"));

export default function StudyFooter({ study, liveLabel = "Live" }) {
  const footerRef = useRef(null);
  const [inView, setInView] = useState(false);
  const nextStudy =
    CASE_STUDIES.find((item) => item.id !== study.id && item.ready) ??
    CASE_STUDIES.find((item) => item.id !== study.id);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
          setInView(true);
        }
      },
      { threshold: [0, 0.2, 0.45] }
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={footerRef} className="study-footer">
      <div className="contact-plus-stage" aria-hidden="true">
        <Suspense fallback={null}>
          <ContactCanvas active={inView} />
        </Suspense>
      </div>
      <div className="study-footer-inner">
        <div className="study-footer-copy">
          <p className="about-kicker">Next</p>
          <h2>Let’s design something that ships</h2>
          <p className="about-lede">
            Product design with the ability to take the interface into the product.
          </p>
        </div>
        <div className="study-footer-actions">
          <a className="case-studies-action case-studies-action--primary" href="mailto:chasenaidoo9@gmail.com">
            Email
          </a>
          <a className="case-studies-action" href="/#work">
            All work
          </a>
          {study.live ? (
            <a className="case-studies-action" href={study.live} target="_blank" rel="noreferrer">
              {liveLabel}
            </a>
          ) : null}
          {nextStudy ? (
            <a className="case-studies-action" href={caseStudyHref(nextStudy.id)}>
              {nextStudy.client}
              {nextStudy.ready ? null : " (soon)"}
            </a>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
