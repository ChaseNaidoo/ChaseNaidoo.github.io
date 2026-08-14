import { useEffect } from "react";

import { CASE_STUDIES, caseStudyHref, getCaseStudy } from "./data/caseStudies.js";
import PageFrame from "./PageFrame.jsx";
import SiteHeader from "./SiteHeader.jsx";
import FancamCaseStudy from "./caseStudies/FancamCaseStudy.jsx";
import BalmerCaseStudy from "./caseStudies/BalmerCaseStudy.jsx";
import PixelPortfolioCaseStudy from "./caseStudies/PixelPortfolioCaseStudy.jsx";

const STUDY_PAGES = {
  fancam: FancamCaseStudy,
  balmer: BalmerCaseStudy,
  "pixel-portfolio": PixelPortfolioCaseStudy
};

const HOME_NAV = {
  brandHref: "/",
  workHref: "/#work",
  aboutHref: "/#about",
  contactHref: "/#contact"
};

export default function CaseStudyPage({ slug }) {
  const study = getCaseStudy(slug);
  const StudyBody = STUDY_PAGES[slug];

  useEffect(() => {
    window.scrollTo(0, 0);
    const previous = document.title;
    document.title = study
      ? `${study.title} | Cameron Chase Naidoo`
      : "Case study | Cameron Chase Naidoo";
    return () => {
      document.title = previous;
    };
  }, [study]);

  if (!study) {
    return (
      <PageFrame className="study-shell">
        <SiteHeader {...HOME_NAV} />
        <main id="main-content" className="study-missing">
          <p className="about-kicker">404</p>
          <h1>This case study isn’t here</h1>
          <p className="about-lede">The link may be old. Head back to selected work.</p>
          <a className="case-studies-action case-studies-action--primary" href="/#work">
            Case studies
          </a>
        </main>
      </PageFrame>
    );
  }

  if (!StudyBody) {
    const nextReady = CASE_STUDIES.find((item) => item.ready && item.id !== study.id);

    return (
      <PageFrame className="study-shell">
        <SiteHeader {...HOME_NAV} />
        <main id="main-content" className="study-missing">
          <p className="about-kicker">
            {study.index} / {study.client}
          </p>
          <h1>{study.title}</h1>
          <p className="about-lede">This write-up is in progress. Selected work is on the home page.</p>
          <div className="study-missing-actions">
            {nextReady ? (
              <a
                className="case-studies-action case-studies-action--primary"
                href={caseStudyHref(nextReady.id)}
              >
                Read {nextReady.client}
              </a>
            ) : null}
            <a className="case-studies-action" href="/#work">
              All case studies
            </a>
          </div>
        </main>
      </PageFrame>
    );
  }

  return (
    <PageFrame className="study-shell">
      <SiteHeader {...HOME_NAV} />
      <main id="main-content">
        <StudyBody study={study} />
      </main>
    </PageFrame>
  );
}
