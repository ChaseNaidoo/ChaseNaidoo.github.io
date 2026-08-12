import { CASE_STUDIES, caseStudyHref } from "../data/caseStudies.js";
import balmerChat from "../../img/balmer-chat.png";

const PROCESS = [
  {
    index: "01",
    title: "Frame",
    body: "Business acceleration discovery as a guided conversation — not a form dump."
  },
  {
    index: "02",
    title: "Compose",
    body: "Split brand atmosphere (editorial photography) from the working chat surface."
  },
  {
    index: "03",
    title: "Pace",
    body: "Short prompts, clear CTAs, typing states — momentum without overwhelm."
  },
  {
    index: "04",
    title: "Ship",
    body: "High-fidelity UI into a live discovery assistant for Balmer Agency."
  }
];

const JOURNEY = [
  { index: "01", title: "Arrive", body: "Brand left, assistant right — job is obvious" },
  { index: "02", title: "Orient", body: "Bot sets time, stakes, and permission to ask" },
  { index: "03", title: "Commit", body: "Ready! as the first low-friction reply" },
  { index: "04", title: "Discover", body: "Questions that map ops friction to AI leverage" }
];

export default function BalmerCaseStudy({ study }) {
  const nextStudy = CASE_STUDIES.find((item) => item.id !== study.id && item.ready)
    ?? CASE_STUDIES.find((item) => item.id !== study.id);

  return (
    <article className="study">
      <header className="study-hero">
        <a className="study-back" href="/#work">
          ← Case studies
        </a>
        <p className="about-kicker">
          {study.index} / {study.client} / {study.period}
        </p>
        <h1>A discovery assistant that feels like brand, not a bot shell</h1>
        <p className="study-lede">
          Designed the AI Business Acceleration Discovery experience for Balmer Agency — editorial
          photography beside a calm chat surface — so leaders can map AI opportunity in minutes,
          not a questionnaire marathon.
        </p>

        <dl className="study-meta">
          <div>
            <dt>Role</dt>
            <dd>Product design + UI</dd>
          </div>
          <div>
            <dt>Scope</dt>
            <dd>Chat UX, layout, visual system</dd>
          </div>
          <div>
            <dt>Constraint</dt>
            <dd>5–10 minute discovery arc</dd>
          </div>
          <div>
            <dt>Live</dt>
            <dd>
              {study.live ? (
                <a href={study.live} target="_blank" rel="noreferrer">
                  Open assistant
                </a>
              ) : (
                "In product"
              )}
            </dd>
          </div>
        </dl>
      </header>

      <figure className="study-figure study-figure--hero">
        <div className="study-shot study-shot--product">
          <img
            src={balmerChat}
            alt="Balmer AI Business Acceleration Discovery — editorial portraits beside the chat assistant"
          />
        </div>
        <figcaption>
          Split composition: Balmer brand atmosphere on the left, working discovery chat on the right.
        </figcaption>
      </figure>

      <section className="study-layout" aria-label="Case study overview">
        <div className="study-snap">
          <article className="study-snap-cell">
            <p className="study-label">Problem</p>
            <h2>AI discovery felt like homework</h2>
            <p>
              Leaders need to see where AI could accelerate operations — but long forms and generic
              chatbot chrome kill momentum before the first useful answer.
            </p>
          </article>
          <article className="study-snap-cell">
            <p className="study-label">Approach</p>
            <h2>Conversation as product</h2>
            <p>
              Treat the assistant as the product: welcome with stakes and time, one clear first
              action, then paced questions. Brand stays present without crowding the thread.
            </p>
          </article>
          <article className="study-snap-cell">
            <p className="study-label">Outcome</p>
            <h2>Ready in one click</h2>
            <p>
              A live discovery surface that looks like Balmer and behaves like a short guided
              interview — not a support widget bolted onto a landing page.
            </p>
          </article>
        </div>

        <aside className="study-edge-band">
          <p className="study-label">The edge</p>
          <p>
            <strong>Designed the system end-to-end.</strong> Layout, chat hierarchy, input, and
            motion cues — so the AI feels intentional inside the brand, not dropped into a default
            messenger frame.
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
                src={balmerChat}
                alt="Chat thread with welcome message, Ready reply, and typing state"
              />
            </div>
            <p className="study-visual-carousel-caption study-showcase-caption">
              Welcome → commit → typing — the first thirty seconds of trust
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
              <li>Split brand / chat composition</li>
              <li>Welcome copy with time expectation</li>
              <li>Primary reply chips + free-text input</li>
              <li>Typing state and quiet dark UI system</li>
            </ul>
          </article>
          <article>
            <p className="study-label">Reflection</p>
            <p>
              The hard part wasn’t the bubbles — it was making discovery feel short and branded.
              Next pass: instrument drop-off after Ready! so question order earns its keep with
              real completion data.
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
              Live assistant
            </a>
          ) : null}
          {nextStudy ? (
            <a className="case-studies-action" href={caseStudyHref(nextStudy.id)}>
              {nextStudy.client} {nextStudy.ready ? null : "(soon)"}
            </a>
          ) : null}
        </div>
      </footer>
    </article>
  );
}
