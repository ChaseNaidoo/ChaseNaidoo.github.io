import fancamAfter from "../../img/fancam-after.webp";
import balmerChat from "../../img/balmer-chat.webp";
import pixelPortfolioVisual from "../../img/pixel-world.webp";

export const CASE_STUDIES = [
  {
    id: "fancam",
    index: "01",
    client: "Fancam",
    period: "2025–Present",
    title: "Fancam Event Experience",
    lede:
      "Designed the fan-facing experience across viewer, camera, postcards, and shop, then shipped it on the live platform alongside responsive discovery, theming, and commerce tooling.",
    outcome: "After launch, engaged fans went deeper: on-page interactions up 50%, with about 1 in 4 returning.",
    image: fancamAfter,
    imageAlt: "Redesigned Fancam viewer with event header, in-crowd tags, and camera dock",
    imagePosition: "center center",
    github: null,
    live: "https://vikings.fancam.com/20260104?s=west-view&atv=10.0&ath=-96.453&fov=50.0",
    ready: true
  },
  {
    id: "balmer",
    index: "02",
    client: "Balmer",
    period: "2024–2025",
    title: "AI Business Acceleration Discovery",
    lede:
      "Designed and built Balmer Agency’s AI Business Acceleration Discovery: branded guided chat into a ranked opportunity report and PDF.",
    outcome: "Live React prototype with n8n-backed chat, report page, and PDF export. Design-led case: no engagement metrics yet.",
    image: balmerChat,
    imageAlt: "Balmer AI discovery assistant with brand photography and chat interface",
    imagePosition: "center top",
    github: null,
    live: "https://balmer-version-2.vercel.app",
    ready: true
  },
  {
    id: "pixel-portfolio",
    index: "03",
    client: "Personal",
    period: "2024",
    title: "Pixel Art Portfolio",
    lede:
      "Self-initiated Kaboom.js portfolio: a top-down pixel world with quest log, dialogue, and credentials you find by exploring.",
    outcome: "Live interactive spatial CV on Vercel. Interview feedback: memorable, and it still gets people to the resume.",
    image: pixelPortfolioVisual,
    imageAlt: "Pixel art portfolio world with lab, credentials room, overworld map, and quest log",
    imagePosition: "center center",
    github: "https://github.com/ChaseNaidoo/Pixel_art_portfolio",
    live: "https://pixel-art-portfolio.vercel.app/",
    ready: true
  }
];

export function caseStudyHref(id) {
  return `/case-studies/${id}`;
}

export function getCaseStudy(id) {
  return CASE_STUDIES.find((study) => study.id === id) ?? null;
}
