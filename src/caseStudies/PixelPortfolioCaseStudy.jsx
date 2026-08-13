import StudyFooter from "../StudyFooter.jsx";
import pixelPortfolio from "../../img/pixel-portfolio.png";
import pixelWalkthrough from "../../img/pixel-portfolio-walkthrough.mp4";

const PROCESS = [
  {
    index: "01",
    title: "Premise",
    body: "A resume you walk through — rooms and a map instead of sections and links."
  },
  {
    index: "02",
    title: "World",
    body: "Hand-built scenes: lab, interior, overworld — each holding a piece of the story."
  },
  {
    index: "03",
    title: "Quest",
    body: "HUD checklist turns browsing into exploration: degree, resume, PC, certificate."
  },
  {
    index: "04",
    title: "Ship",
    body: "Click-to-move interaction and pixel UI live on Vercel."
  }
];

const JOURNEY = [
  { index: "01", title: "Land", body: "Welcome + tap/click to move" },
  { index: "02", title: "Explore", body: "Cross rooms and the overworld map" },
  { index: "03", title: "Find", body: "Quest log marks what you’ve discovered" },
  { index: "04", title: "Take", body: "Resume, degree, PC — artifacts in place" }
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
        <h1>A portfolio you explore like a game world</h1>
        <p className="study-lede">
          Self-initiated pixel-art portfolio where visitors move through handcrafted scenes —
          lab, rooms, overworld — and a quest log turns credentials into things you find, not
          a download button at the top.
        </p>

        <dl className="study-meta">
          <div>
            <dt>Role</dt>
            <dd>Design + build</dd>
          </div>
          <div>
            <dt>Scope</dt>
            <dd>World, interaction, HUD</dd>
          </div>
          <div>
            <dt>Constraint</dt>
            <dd>Playful without losing clarity</dd>
          </div>
          <div>
            <dt>Live</dt>
            <dd>
              {study.live ? (
                <a href={study.live} target="_blank" rel="noreferrer">
                  Open world
                </a>
              ) : (
                "In product"
              )}
            </dd>
          </div>
        </dl>
      </header>

      <figure className="study-figure study-figure--hero">
        <div className="study-shot study-shot--video">
          <video
            src={pixelWalkthrough}
            poster={pixelPortfolio}
            controls
            muted
            playsInline
            loop
            autoPlay
            preload="metadata"
            aria-label="Walkthrough of the pixel art portfolio — moving between scenes and completing quest log goals"
          />
        </div>
        <figcaption>
          Walkthrough — click to move, explore rooms and the map, clear quest log goals.
        </figcaption>
      </figure>

      <section className="study-layout" aria-label="Case study overview">
        <div className="study-snap">
          <article className="study-snap-cell">
            <p className="study-label">Problem</p>
            <h2>Portfolios flatten personality</h2>
            <p>
              Standard grids make every designer look the same. I wanted something memorable that
              still made resume, degree, and work easy to find.
            </p>
          </article>
          <article className="study-snap-cell">
            <p className="study-label">Approach</p>
            <h2>Spatial CV</h2>
            <p>
              Borrow game UX: move to explore, quest log for goals, scenes as content containers.
              Nostalgia as craft signal — not decoration for its own sake.
            </p>
          </article>
          <article className="study-snap-cell">
            <p className="study-label">Outcome</p>
            <h2>Play with a point</h2>
            <p>
              A live interactive world that showcases interaction design, motion, and front-end
              craft — and still gets someone to the resume.
            </p>
          </article>
        </div>

        <aside className="study-edge-band">
          <p className="study-label">The edge</p>
          <p>
            <strong>Designed it. Built it.</strong> Art direction, interaction model, and
            implementation in one pass — proof that playful systems can still ship clean.
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
            <div className="study-shot study-shot--product">
              <img
                src={pixelPortfolio}
                alt="Quest log with explore and degree complete, resume and PC still open"
              />
            </div>
            <p className="study-visual-carousel-caption study-showcase-caption">
              Quest log — exploration goals as checklist, not nav chrome
            </p>
          </div>
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
              <li>Click/tap movement through scenes</li>
              <li>Lab, interior, and overworld map</li>
              <li>Quest log HUD for key artifacts</li>
              <li>Pixel typography and game-UI language</li>
            </ul>
          </article>
          <article>
            <p className="study-label">Reflection</p>
            <p>
              Delight only works if the goals stay readable. Next time I’d add a soft “skip to
              resume” for impatient recruiters without breaking the fantasy for everyone else.
            </p>
          </article>
        </div>
      </section>

      <StudyFooter study={study} liveLabel="Live world" />
    </article>
  );
}
