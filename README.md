# Cameron Chase Naidoo — Portfolio

Personal portfolio for Cameron Chase Naidoo, a product designer and front-end engineer. Built as a
React single-page app with a WebGL hero and three long-form case studies.

Live: https://chasenaidoo.github.io

## Stack

- React 19
- Vite 8
- Three.js via `@react-three/fiber` and `@react-three/drei`
- Plain CSS (`src/styles.css`), no framework

## Getting started

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
npm run preview  # serve the production build
```

## Structure

```
index.html                 Document head, meta and social tags
public/                    Static files copied as-is (resume PDF, favicons, OG image)
img/                       Case study screenshots and video
src/
  App.jsx                  Home page: hero, work carousel, about, contact, footer
  CaseStudyPage.jsx        Routing shell for individual case studies
  caseStudies/             One component per case study write-up
  data/caseStudies.js      Shared case study metadata used by home and study pages
  HeroCanvas.jsx           WebGL hero title scene
  plusMotif.jsx            Shared 3D plus geometry and helpers
  PageFrame.jsx            Page shell: skip link, custom cursor, grid hover
  SiteHeader.jsx           Nav pill
  StudyFooter.jsx          Shared footer for case study pages
  styles.css               All styles
```

## Case studies

| Study | Client | Notes |
| --- | --- | --- |
| Fancam Event Experience | Fancam | Live-event platform, viewer through commerce |
| AI Business Acceleration Discovery | Balmer Agency | Branded guided chat, report, PDF export |
| Pixel Art Portfolio | Personal | Kaboom.js top-down world as an interactive CV |

## Notes

- The hero WebGL scene pauses when scrolled out of view or when the tab is hidden, and drops to a
  lower tier on mobile, coarse pointers, and `prefers-reduced-motion`.
- The resume PDF lives in `public/` and is linked from the nav, contact section, and study footers.
- Deployed from the repository root via GitHub Pages (`.nojekyll` is in `public/`).
