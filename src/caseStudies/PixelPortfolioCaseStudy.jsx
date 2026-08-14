import StudyFooter from "../StudyFooter.jsx";
import StudyVisualCarousel from "../StudyVisualCarousel.jsx";
import pixelWorld from "../../img/pixel-world.webp";
import pixelDialogueCertificate from "../../img/pixel-dialogue-certificate.webp";
import pixelDialogueResume from "../../img/pixel-dialogue-resume.webp";
import pixelWalkthrough from "../../img/pixel-portfolio-walkthrough.mp4";

const JOURNEY = [
  { index: "01", title: "Land", body: "Welcome, then tap, click, or arrow keys to move" },
  { index: "02", title: "Explore", body: "Walk the map and collide with interactive objects" },
  { index: "03", title: "Find", body: "Quest log marks resume, PC, certificate, and degree" },
  { index: "04", title: "Take", body: "Dialogue delivers links and story; clear all goals for a reward" }
];

const PRODUCT_SLIDES = [
  {
    src: pixelWorld,
    alt: "Pixel art portfolio overview with lab, certificate room, overworld map, and quest log",
    caption: "World: lab, credentials room, and overworld in one spatial CV"
  },
  {
    src: pixelDialogueResume,
    alt: "Resume desk dialogue with a link to the resume and email contact",
    caption: "Resume desk: credentials live in dialogue, with a direct link out"
  },
  {
    src: pixelDialogueCertificate,
    alt: "Certificate dialogue for ALX Africa Full-Stack Software Engineering",
    caption: "Certificate: interactables open typewriter dialogue, not a download row"
  }
];

export default function PixelPortfolioCaseStudy({ study }) {
  return (
    <article className="study">
      <header className="study-hero">
        <a className="study-back" href="/#work">
          ← Case studies
        </a>
        <p className="about-kicker">
          {study.index} / {study.client} / {study.period}
        </p>
        <h1>Building a portfolio you explore like a game world</h1>
        <p className="study-lede">
          Self-initiated pixel-art portfolio built with Kaboom.js. Visitors move through a
          handcrafted top-down world, talk to objects through a typewriter dialogue system, and
          clear a quest log that turns credentials into things you find rather than a download
          button at the top.
        </p>

        <dl className="study-meta">
          <div>
            <dt>Role</dt>
            <dd>Design + build (solo)</dd>
          </div>
          <div>
            <dt>Scope</dt>
            <dd>World, interaction, quest HUD</dd>
          </div>
          <div>
            <dt>Stack</dt>
            <dd>Kaboom.js, Vite, JavaScript</dd>
          </div>
          <div>
            <dt>Live</dt>
            <dd>
              {study.live ? (
                <a href={study.live} target="_blank" rel="noreferrer">
                  Open world <span aria-hidden="true">[↗]</span>
                </a>
              ) : (
                "Live"
              )}
            </dd>
          </div>
        </dl>
      </header>

      <figure className="study-figure study-figure--hero">
        <div className="study-shot study-shot--video">
          <video
            src={pixelWalkthrough}
            poster={pixelWorld}
            controls
            muted
            playsInline
            loop
            preload="none"
            aria-label="Walkthrough of the pixel art portfolio, moving between scenes and completing quest log goals"
          />
        </div>
        <figcaption>
          Press play for the walkthrough: click to move, explore the map, clear quest log goals.
        </figcaption>
      </figure>

      <section className="study-layout" aria-label="Case study overview">
        <div className="study-snap">
          <article className="study-snap-cell">
            <p className="study-label">Problem</p>
            <h2>Portfolios flatten personality</h2>
            <p>
              Standard grids make every designer look the same. I wanted something memorable that
              still made resume, degree, projects, and contact easy to find for a recruiter who is
              short on time.
            </p>
          </article>
          <article className="study-snap-cell">
            <p className="study-label">Approach</p>
            <h2>Spatial CV</h2>
            <p>
              Borrow game UX: move to explore, collide to open dialogue, quest log for goals, map
              objects as content containers. Nostalgia is a craft signal, not decoration for its own
              sake.
            </p>
          </article>
          <article className="study-snap-cell">
            <p className="study-label">Outcome</p>
            <h2>Play with a point</h2>
            <p>
              A live interactive world on Vercel that showcases interaction design, motion, and
              front-end craft, and still gets someone to the resume. In interviews, people remembered
              the site, which is exactly what a personal portfolio should do.
            </p>
          </article>
        </div>

        <aside className="study-edge-band">
          <p className="study-label">My role</p>
          <p>
            <strong>I designed and built the entire experience myself.</strong> That includes the
            pixel art direction and map, Kaboom.js movement and collision, dialogue with a
            typewriter effect, the quest checklist HUD, completion notifications and confetti, and
            responsive camera scaling so it holds up on different screens.
          </p>
        </aside>

        <div className="study-showcase">
          <div className="study-showcase-rail">
            <p className="study-label">Journey</p>
            <ol>
              {JOURNEY.map((step) => (
                <li key={step.index}>
                  <span>{step.index}</span>
                  <strong>{step.title}</strong>
                  {step.body}
                </li>
              ))}
            </ol>
          </div>
          <div className="study-showcase-stage">
            <StudyVisualCarousel slides={PRODUCT_SLIDES} label="Pixel portfolio screens" />
          </div>
        </div>

        <div className="study-close">
          <article>
            <p className="study-label">What shipped</p>
            <ul>
              <li>Click, tap, and keyboard movement with walk animations</li>
              <li>Handcrafted map with collision boundaries and interactable objects</li>
              <li>Typewriter dialogue for resume, PC, certificate, degree, and more</li>
              <li>Quest log HUD with live completion and notifications</li>
              <li>Completion reward with confetti when all objectives are cleared</li>
              <li>Vite build deployed on Vercel</li>
            </ul>
          </article>
          <article>
            <p className="study-label">Why it mattered</p>
            <p>
              Delight only works if the goals stay readable. The quest log turns exploration into a
              clear path to credentials, which is the point of a portfolio. Next time I would add a
              soft skip-to-resume path for impatient recruiters without breaking the fantasy for
              everyone else.
            </p>
          </article>
        </div>
      </section>

      <StudyFooter study={study} liveLabel="Live world" />
    </article>
  );
}
