import BeforeAfterSlider from "../BeforeAfterSlider.jsx";
import StudyFooter from "../StudyFooter.jsx";
import StudyVisualCarousel from "../StudyVisualCarousel.jsx";
import fancamBefore from "../../img/fancam-before.webp";
import fancamAfter from "../../img/fancam-after.webp";
import fancamCamera from "../../img/fancam-camera.webp";
import fancamFindSeat from "../../img/fancam-find-seat.webp";
import fancamGalleryMenu from "../../img/fancam-gallery-menu.webp";
import fancamPostcard from "../../img/fancam-postcard.webp";
import fancamShopProduct from "../../img/fancam-shop-product.webp";
import fancamShopCustomize from "../../img/fancam-shop-customize.webp";
import fancamShopCart from "../../img/fancam-shop-cart.webp";
import fancamShopDock from "../../img/fancam-shop-dock.webp";

const VIEWER_JOURNEY = [
  { index: "01", title: "Land", body: "Arrive in the event scene" },
  { index: "02", title: "Find seat", body: "Locate yourself in the crowd" },
  { index: "03", title: "Capture", body: "Shutter frames the postcard" },
  { index: "04", title: "Keep", body: "Save, share, return in gallery" }
];

const SHOP_JOURNEY = [
  { index: "01", title: "Enter", body: "Cart on the dock, shop from the scene" },
  { index: "02", title: "Browse", body: "Product detail over the live scene" },
  { index: "03", title: "Add", body: "Confirm the item without leaving the event" },
  { index: "04", title: "Cart", body: "Review qty, subtotal, checkout" }
];

const DECISIONS = [
  {
    title: "Chrome off the glass",
    body:
      "The legacy viewer ringed the panorama with named feature buttons that competed with the crowd photo. I moved actions into a bottom dock and put the tags in the crowd itself, so the image is the interface.",
    trade:
      "Icons are less explicit than labels, so tooltips ease first-time adoption. Once fans know the dock, the labels get out of the way."
  },
  {
    title: "One primary action per step",
    body:
      "Find, capture, and keep each get their own moment. In camera mode the shutter is the only primary control and everything else steps back.",
    trade:
      "Fewer options visible at once, which matches how mobile apps already work: one clear action, then the next."
  },
  {
    title: "Theming as tokens, not per-event CSS",
    body:
      "Every event used to be hand-styled, so each new team or sponsor became bespoke front-end work. I moved look and feel into reusable theme values the team sets per event.",
    trade:
      "Less bespoke art direction per event, in exchange for launches that need no new styling."
  },
  {
    title: "Keep commerce inside the event",
    body:
      "Shop sits on the same dock, with product detail and cart layered over the panorama rather than linking out to a separate store.",
    trade:
      "More overlay state to manage, but the fan never loses their seat to buy the memento."
  }
];

const PRODUCT_SLIDES = [
  {
    src: fancamAfter,
    alt: "Explore state with event header, in-crowd tags, and camera dock",
    caption: "Explore: event chrome, tags in the crowd, camera dock",
    shotClass: ""
  },
  {
    src: fancamFindSeat,
    alt: "Find Your Seat modal with section, row, seat selectors, and email",
    caption: "Find seat: locate yourself without leaving the panorama",
    shotClass: "study-shot--modal"
  },
  {
    src: fancamCamera,
    alt: "Camera capture mode with viewfinder grid and shutter",
    caption: "Capture: the shutter is the primary action",
    shotClass: ""
  },
  {
    src: fancamPostcard,
    alt: "Postcard overlay with edit, save, share, and more photos from this view",
    caption: "Postcard: edit, save, share, and related frames",
    shotClass: "study-shot--modal"
  },
  {
    src: fancamGalleryMenu,
    alt: "Gallery drawer with captured photos over the stadium viewer",
    caption: "Gallery: captures live beside the panorama, without the side menu",
    shotClass: "study-shot--ui"
  }
];

const SHOP_SLIDES = [
  {
    src: fancamShopDock,
    alt: "Event panorama with shop on the bottom dock",
    caption: "Entry: shop lives on the dock, over the live scene",
    shotClass: ""
  },
  {
    src: fancamShopProduct,
    alt: "Shop modal with ceramic mug product detail and other products row",
    caption: "Product: detail, variants, add to cart over the panorama",
    shotClass: "study-shot--modal"
  },
  {
    src: fancamShopCustomize,
    alt: "Shop modal after adding a ceramic mug, with Added confirmation",
    caption: "Added: confirmation stays in the event, cart badge updates",
    shotClass: "study-shot--modal"
  },
  {
    src: fancamShopCart,
    alt: "Shop cart overlay with line items, subtotal, and checkout",
    caption: "Cart: review and checkout without leaving the event",
    shotClass: "study-shot--modal"
  }
];

export default function FancamCaseStudy({ study }) {
  return (
    <article className="study">
      <header className="study-hero">
        <a className="study-back" href="/#work">
          ← Case studies
        </a>
        <p className="about-kicker">
          {study.index} / {study.client} / {study.period}
        </p>
        <h1>Modernizing Fancam’s live-event experience, then shipping it</h1>
        <p className="study-lede">
          Fancam turns a gigapixel crowd photo into an interactive event product: find your seat,
          capture the moment, share it, buy the memento. I led the fan-facing redesign of the viewer,
          camera, postcards, and shop, then shipped it in the live Node/Express stack with Vue admin,
          theming, discovery, and supporting APIs.
        </p>

        <dl className="study-meta">
          <div>
            <dt>Role</dt>
            <dd>Product design + engineering</dd>
          </div>
          <div>
            <dt>Scope</dt>
            <dd>Fan UX, theming, admin, commerce</dd>
          </div>
          <div>
            <dt>Stack</dt>
            <dd>Node/Express, Vue, Less, krpano</dd>
          </div>
          <div>
            <dt>Live</dt>
            <dd>
              {study.live ? (
                <a href={study.live} target="_blank" rel="noreferrer">
                  Open Fancam <span aria-hidden="true">[↗]</span>
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
        <figcaption>
          Product direction: reduce legacy chrome and organize the live panorama around finding,
          capturing, and keeping the moment.
        </figcaption>
      </figure>

      <section className="study-layout" aria-label="Case study overview">
        <div className="study-snap">
          <article className="study-snap-cell">
            <p className="study-label">Problem</p>
            <h2>Desktop-era UI, mobile-era fans</h2>
            <p>
              Most fans now arrive on a phone from a social link, but the viewer still leaned on
              desktop patterns and named feature buttons that competed with the crowd. Per-event look
              and feel was hand-built, so every new team or sponsor became bespoke work.
            </p>
          </article>
          <article className="study-snap-cell">
            <p className="study-label">Approach</p>
            <h2>One fan sequence, one system</h2>
            <p>
              Reframe the viewer around a clear sequence of find, capture, then keep, and reuse that
              hierarchy across postcards, gallery, and shop. Turn per-event styling into reusable
              theme tokens, and modernize the operator tools inside the existing architecture.
            </p>
          </article>
          <article className="study-snap-cell">
            <p className="study-label">Outcome</p>
            <h2>Designed, then shipped live</h2>
            <p>
              A mobile-first, sequenced experience running on the production platform. Client
              engagement data shows fans who arrive are spending longer and interacting more, even
              when overall page views are softer.
            </p>
          </article>
        </div>

        <aside className="study-edge-band">
          <p className="study-label">My role</p>
          <p>
            <strong>I designed the fan experience and built it into the live product.</strong>{" "}
            I owned the viewer, camera, postcard, and shop direction, then shipped it in the
            existing Node/Express stack: Vue admin modules, Less theming, krpano-facing config,
            supporting APIs and models, and the in-product shop surfaces. Because the same person
            designed and shipped it, decisions were tested against real data models and release
            constraints instead of getting lost in handoff.
          </p>
        </aside>

        <section className="study-decisions" aria-label="Design decisions">
          <p className="study-label">Decisions</p>
          <ol>
            {DECISIONS.map((decision) => (
              <li key={decision.title}>
                <strong>{decision.title}</strong>
                <p>{decision.body}</p>
                <p className="study-decision-trade">
                  <span>Tradeoff</span>
                  {decision.trade}
                </p>
              </li>
            ))}
          </ol>
        </section>

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

        <div className="study-results">
          <div className="study-results-intro">
            <p className="study-label">Client engagement</p>
            <h2>Fans who arrive are going deeper</h2>
            <p>
              On a live client event, overall page views were down, but the people who opened the
              Fancam spent more time and interacted more. Scale and repeat usage also show this is
              not a one-and-done novelty click.
            </p>
          </div>
          <dl className="study-results-grid">
            <div>
              <dt>Unique views</dt>
              <dd>
                74% <span aria-hidden="true">→</span> 77%
              </dd>
              <p>Share of traffic that is unique</p>
            </div>
            <div>
              <dt>Avg. attention</dt>
              <dd>
                2.75 <span aria-hidden="true">→</span> 3.3 min
              </dd>
              <p>More time spent in the experience</p>
            </div>
            <div>
              <dt>On-page events</dt>
              <dd>+50%</dd>
              <p>More clicking, zooming, and interacting</p>
            </div>
          </dl>
          <dl className="study-results-grid">
            <div>
              <dt>Interactions</dt>
              <dd>2,467</dd>
              <p>Total post-event engagements</p>
            </div>
            <div>
              <dt>Unique emails</dt>
              <dd>1,628</dd>
              <p>Reach for an experiential product</p>
            </div>
            <div>
              <dt>Returned</dt>
              <dd>25.6%</dd>
              <p>416 people came back more than once</p>
            </div>
          </dl>
          <div className="study-results-notes">
            <article>
              <p className="study-label">Repeat usage</p>
              <p>
                One user returned for 58 interactions. Repeat behavior points to replay and sharing,
                not just searching or buying. The experience has value beyond a single visit.
              </p>
            </article>
            <article>
              <p className="study-label">Where they go next</p>
              <p>
                Among return visitors, 43% revisited the same seat only (re-viewing or re-sharing
                themselves). 57% explored multiple locations (friends, family, or the wider crowd).
                That mix is personal identification and exploratory curiosity in the same product.
              </p>
            </article>
          </div>
        </div>

        <div className="study-close">
          <article>
            <p className="study-label">What shipped</p>
            <ul>
              <li>Mobile-first viewer sequence: find, capture, keep, share</li>
              <li>Responsive Find a Fancam discovery experience</li>
              <li>Vue admin modules for panorama, moments, events, and theming</li>
              <li>Reusable theme tokens so new events launch without bespoke styling</li>
              <li>Node/Express API and model work for discovery, user-gate, and shop stats</li>
              <li>In-event shop: personalize, cart, checkout, and reporting</li>
            </ul>
          </article>
          <article>
            <p className="study-label">Why it mattered</p>
            <p>
              Designing and building it end to end meant the redesign survived production instead of
              stalling at handoff. Client data shows deeper sessions, strong post-event reach, and
              meaningful repeat usage (about one in four fans came back), which is what you want from
              a find, capture, and share loop. Reusable theming also made the next event cheaper to
              launch.
            </p>
          </article>
        </div>
      </section>

      <StudyFooter study={study} liveLabel="Live Fancam" />
    </article>
  );
}
