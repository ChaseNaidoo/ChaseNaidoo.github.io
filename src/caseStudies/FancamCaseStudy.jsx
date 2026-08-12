import { CASE_STUDIES, caseStudyHref } from "../data/caseStudies.js";
import BeforeAfterSlider from "../BeforeAfterSlider.jsx";
import StudyVisualCarousel from "../StudyVisualCarousel.jsx";
import fancamBefore from "../../img/fancam-before.png";
import fancamAfter from "../../img/fancam-after.png";
import fancamCamera from "../../img/fancam-camera.png";
import fancamGalleryMenu from "../../img/fancam-gallery-menu.png";
import fancamPostcard from "../../img/fancam-postcard.png";
import fancamShopProduct from "../../img/fancam-shop-product.png";
import fancamShopCustomize from "../../img/fancam-shop-customize.png";
import fancamShopCart from "../../img/fancam-shop-cart.png";
import fancamShopDock from "../../img/fancam-shop-dock.png";

const PROCESS = [
  {
    index: "01",
    title: "Audit",
    body: "Mapped viewer chrome, CTAs, and shop entry points — what helped fans find themselves vs. what competed for attention."
  },
  {
    index: "02",
    title: "Reframe",
    body: "One product model: camera for the scene, shop for the merch — not a pile of labeled feature buttons."
  },
  {
    index: "03",
    title: "System",
    body: "Shared hierarchy and motion language across dock, side menu, postcards, and shop so the event feels like one app."
  },
  {
    index: "04",
    title: "Ship",
    body: "Designed and built on the live panoramic stack — no greenfield rewrite, NFL events as the production floor."
  }
];

const DECISIONS = [
  {
    title: "Camera over labels",
    body: "Tag Yourself and Digital Postcard named features. Fans needed a shutter and a keep loop — so the dock became the product."
  },
  {
    title: "Chrome off the glass",
    body: "Secondary actions moved into a side menu so the panorama stays the stage. Shop and tools are reachable without covering the crowd."
  },
  {
    title: "Shop as a surface",
    body: "Merch isn’t a bolted link. The shop interface got the same design pass — browse and buy in the event language, not a generic storefront drop-in."
  },
  {
    title: "Ship inside the stack",
    body: "Gigapixel viewer constraints came first. Every pattern had to survive existing architecture, performance, and live-event reality."
  }
];

const VIEWER_JOURNEY = [
  { index: "01", title: "Land", body: "Arrive in the event scene" },
  { index: "02", title: "Find seat", body: "Locate yourself in the crowd" },
  { index: "03", title: "Capture", body: "Shutter frames the postcard" },
  { index: "04", title: "Keep", body: "Save, share, return in gallery" }
];

const SHOP_JOURNEY = [
  { index: "01", title: "Enter", body: "Cart on the dock — shop from the scene" },
  { index: "02", title: "Browse", body: "Product detail over the live scene" },
  { index: "03", title: "Personalize", body: "Pull a frame from Fancam or upload" },
  { index: "04", title: "Cart", body: "Review qty, subtotal, checkout" }
];

const PRODUCT_SLIDES = [
  {
    src: fancamAfter,
    alt: "Explore state with event header, tags, and camera dock",
    caption: "Explore — event chrome, tags in the crowd, camera dock",
    shotClass: ""
  },
  {
    src: fancamGalleryMenu,
    alt: "Gallery drawer and side menu around the stadium viewer",
    caption: "Gallery + side menu — chrome off the glass",
    shotClass: "study-shot--ui"
  },
  {
    src: fancamCamera,
    alt: "Camera capture mode with viewfinder grid and shutter",
    caption: "Capture — shutter is the CTA",
    shotClass: ""
  },
  {
    src: fancamPostcard,
    alt: "Postcard modal with edit, save, and share actions",
    caption: "Postcard — edit, save, share, QR",
    shotClass: "study-shot--modal"
  }
];

const SHOP_SLIDES = [
  {
    src: fancamShopDock,
    alt: "Event panorama with bottom dock showing cart badge on the shop icon",
    caption: "Entry — shop lives on the dock, cart count on the glass",
    shotClass: ""
  },
  {
    src: fancamShopProduct,
    alt: "Shop modal with ceramic mug product detail and other products row",
    caption: "Product — detail, variants, add to cart over the panorama",
    shotClass: "study-shot--modal"
  },
  {
    src: fancamShopCustomize,
    alt: "Shop personalization with Choose from Fancam and Upload photo options",
    caption: "Personalize — memorabilia from the fancam frame",
    shotClass: "study-shot--modal"
  },
  {
    src: fancamShopCart,
    alt: "Shop cart overlay with line items, subtotal, and checkout",
    caption: "Cart — review and checkout without leaving the event",
    shotClass: "study-shot--modal"
  }
];

export default function FancamCaseStudy({ study }) {
  const nextStudy =
    CASE_STUDIES.find((item) => item.id !== study.id && item.ready) ??
    CASE_STUDIES.find((item) => item.id !== study.id);

  return (
    <article className="study">
      <header className="study-hero">
        <a className="study-back" href="/#work">
          ← Case studies
        </a>
        <p className="about-kicker">
          {study.index} / {study.client} / {study.period}
        </p>
        <h1>Modernizing a live event product — viewer, camera, and shop</h1>
        <p className="study-lede">
          End-to-end product design and front-end for Fancam’s NFL experience: replace Tag Yourself
          with a camera for finding yourself, clear the chrome, ship postcards people keep — and
          redesign the shop so merch feels like part of the same event, not a detour.
        </p>

        <dl className="study-meta">
          <div>
            <dt>Role</dt>
            <dd>Product design + front-end</dd>
          </div>
          <div>
            <dt>Scope</dt>
            <dd>Viewer, camera, gallery, postcards, shop</dd>
          </div>
          <div>
            <dt>Constraint</dt>
            <dd>Live stack, gigapixel viewer</dd>
          </div>
          <div>
            <dt>Live</dt>
            <dd>
              {study.live ? (
                <a href={study.live} target="_blank" rel="noreferrer">
                  Open Fancam
                </a>
              ) : (
                "In product"
              )}
            </dd>
          </div>
        </dl>
      </header>

      <figure className="study-figure study-figure--hero">
        <BeforeAfterSlider
          beforeSrc={fancamBefore}
          afterSrc={fancamAfter}
          beforeAlt="Legacy Fancam viewer with a Tag Yourself call to action and labeled buttons around the panorama"
          afterAlt="Redesigned Fancam viewer with an event header, in-crowd tags, and a camera dock"
        />
        <figcaption>Before → after on the glass. Tag Yourself becomes find yourself.</figcaption>
      </figure>

      <section className="study-layout" aria-label="Case study overview">
        <div className="study-snap">
          <article className="study-snap-cell">
            <p className="study-label">Problem</p>
            <h2>Feature soup on a live stage</h2>
            <p>
              Fans showed up to find themselves in a stadium panorama. The UI answered with labeled
              buttons, competing CTAs, and a shop that felt disconnected from the moment on the
              glass.
            </p>
          </article>
          <article className="study-snap-cell">
            <p className="study-label">Approach</p>
            <h2>One event system</h2>
            <p>
              Treat viewer and shop as surfaces of the same product. Camera dock for the job-to-be-done,
              side menu for secondary tools, shop redesigned to match hierarchy, pace, and brand.
            </p>
          </article>
          <article className="study-snap-cell">
            <p className="study-label">Outcome</p>
            <h2>Shipped on game day</h2>
            <p>
              A clearer find → capture → keep loop, plus a shop path that stays in the Fancam
              language — designed and implemented on the existing live architecture.
            </p>
          </article>
        </div>

        <aside className="study-edge-band">
          <p className="study-label">The edge</p>
          <p>
            <strong>Designed it. Built it.</strong> Viewer, interaction patterns, and shop UI went
            through the same hands — so engineering constraints shaped the design before handoff,
            and the design survived production.
          </p>
        </aside>

        <div className="study-context">
          <p className="study-label">Context</p>
          <h2>A product fans open in the stands</h2>
          <p>
            Fancam is a high-resolution stadium viewer used around live NFL events. People aren’t
            browsing casually — they’re locating a seat, grabbing a moment, sharing it, and
            sometimes buying merch while the game is still the emotional center. Legacy UI treated
            those as separate features. The redesign treats them as one continuous event experience
            that still has to run on the panoramic stack already in production.
          </p>
        </div>

        <div className="study-decisions">
          <p className="study-label">Key decisions</p>
          <ol>
            {DECISIONS.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="study-showcase">
          <div className="study-showcase-rail">
            <p className="study-label">Viewer journey</p>
            <ol>
              {VIEWER_JOURNEY.map((step) => (
                <li key={step.index}>
                  <span>{step.index}</span>
                  <strong>{step.title}</strong>
                  {step.body}
                </li>
              ))}
            </ol>
          </div>
          <div className="study-showcase-stage">
            <StudyVisualCarousel slides={PRODUCT_SLIDES} label="Viewer product screens" />
          </div>
        </div>

        <div className="study-showcase">
          <div className="study-showcase-rail">
            <p className="study-label">Shop journey</p>
            <ol>
              {SHOP_JOURNEY.map((step) => (
                <li key={step.index}>
                  <span>{step.index}</span>
                  <strong>{step.title}</strong>
                  {step.body}
                </li>
              ))}
            </ol>
          </div>
          <div className="study-showcase-stage">
            <StudyVisualCarousel slides={SHOP_SLIDES} label="Shop product screens" />
          </div>
        </div>

        <div className="study-surface study-surface--compact">
          <div className="study-surface-copy">
            <p className="study-label">Shop interface</p>
            <h2>Merch from the moment on the glass</h2>
            <p>
              The shop sits on the panorama as a modal surface — browse products, personalize with a
              Fancam frame or upload, then cart and checkout — without dumping fans into a generic
              storefront. Memorabilia is the bridge: the same scene they found themselves in becomes
              the print on the mug or case.
            </p>
          </div>
          <aside className="study-surface-note">
            <p className="study-label">In the system</p>
            <ul>
              <li>Shop over the live event scene</li>
              <li>Choose from Fancam → product art</li>
              <li>Cart + checkout in-product</li>
              <li>Other products rail for browse</li>
            </ul>
          </aside>
        </div>

        <div className="study-process-strip">
          <p className="study-label">Process</p>
          <ol>
            {PROCESS.map((step) => (
              <li key={step.index}>
                <span>{step.index}</span>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="study-close">
          <article>
            <p className="study-label">What shipped</p>
            <ul>
              <li>Event header + camera dock</li>
              <li>Find-your-seat, capture, gallery</li>
              <li>Postcard edit / save / share / QR</li>
              <li>Side menu for secondary actions</li>
              <li>Shop — product, personalize from Fancam, cart</li>
            </ul>
          </article>
          <article>
            <p className="study-label">Reflection</p>
            <p>
              The unlock wasn’t one screen — it was naming the product: a camera for the crowd,
              with shop as a peer surface. Next time I’d instrument find-seat vs. capture vs. shop
              entry earlier so prioritization for the next season is argued with behavior, not only
              craft.
            </p>
          </article>
        </div>
      </section>

      <footer className="study-footer">
        <div>
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
              Live Fancam
            </a>
          ) : null}
          {nextStudy ? (
            <a className="case-studies-action" href={caseStudyHref(nextStudy.id)}>
              {nextStudy.client}
            </a>
          ) : null}
        </div>
      </footer>
    </article>
  );
}
