import fancamAfter from "../../img/fancam-after.png";
import balmerChat from "../../img/balmer-chat.png";
import pixelPortfolioVisual from "../../img/pixel-portfolio.png";

export const CASE_STUDIES = [
  {
    id: "fancam",
    index: "01",
    client: "Fancam",
    period: "2025–Present",
    title: "Fancam Event Experience",
    lede:
      "Modernized the live NFL Fancam product end-to-end — camera viewer, find-your-seat, postcards, and shop — then shipped it on the existing panoramic stack.",
    outcome: "One event system: find yourself, keep the moment, buy merch — without a platform rewrite.",
    image: fancamAfter,
    imageAlt: "Redesigned Fancam viewer with an event header, in-crowd tags, and a camera dock",
    imagePosition: "center 78%",
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
      "Designed a branded discovery chatbot for Balmer Agency — editorial atmosphere beside a calm chat — so leaders can map AI opportunity in a short guided conversation.",
    outcome: "Discovery that feels like brand, not a bolted-on bot. Ready in one click.",
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
      "Built an interactive pixel-art portfolio where visitors explore projects by moving through a handcrafted world — turning a resume into a playful spatial experience.",
    outcome: "A memorable self-initiated build that showcases interaction design, motion, and front-end craft.",
    image: pixelPortfolioVisual,
    imageAlt: "Pixel art portfolio with lab, room, overworld map, and quest log",
    imagePosition: "center center",
    github: null,
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
