import StudyFooter from "../StudyFooter.jsx";
import StudyVisualCarousel from "../StudyVisualCarousel.jsx";
import balmerChat from "../../img/balmer-chat.webp";
import balmerMobileSuggestions from "../../img/balmer-mobile-suggestions.webp";
import balmerMobileWelcome from "../../img/balmer-mobile-welcome.webp";
import balmerReportReady from "../../img/balmer-report-ready.webp";
import balmerWelcome from "../../img/balmer-welcome.webp";

const JOURNEY = [
  { index: "01", title: "Arrive", body: "Brand left, assistant right, job is obvious" },
  { index: "02", title: "Orient", body: "Bot sets time, stakes, and permission to ask" },
  { index: "03", title: "Commit", body: "Suggestion chips and free-text as the first reply" },
  { index: "04", title: "Report", body: "Opportunity summary, ranked agents, PDF download" }
];

const PRODUCT_SLIDES = [
  {
    src: balmerWelcome,
    alt: "Balmer discovery assistant welcome state on desktop",
    caption: "Welcome: the task and 5 to 10 minute expectation are clear before starting"
  },
  {
    src: balmerChat,
    alt: "Balmer discovery assistant with conversation history and industry suggestion chips",
    caption: "Guided reply: suggestions lower the effort of answering without removing free text"
  },
  {
    src: balmerReportReady,
    alt: "Completed Balmer discovery conversation with View Report and Download PDF actions",
    caption: "Completion: the conversation ends with a report to view or download"
  },
  {
    src: balmerMobileWelcome,
    alt: "Balmer discovery assistant welcome state on a mobile screen",
    caption: "Mobile welcome: brand and conversation stack into one focused column",
    shotClass: "study-shot--contain"
  },
  {
    src: balmerMobileSuggestions,
    alt: "Balmer discovery assistant suggestion chips and input on a mobile screen",
    caption: "Mobile reply: large suggestion targets and a persistent free-text input",
    shotClass: "study-shot--contain"
  }
];

const DECISIONS = [
  {
    title: "A conversation, not a form",
    body:
      "A long questionnaire loses leaders before the first useful answer. The assistant asks one thing at a time and states the 5 to 10 minute cost up front, so the commitment is clear.",
    trade:
      "More turns to collect the same information, but the stated time is what keeps people in the flow."
  },
  {
    title: "Chips first, free text always",
    body:
      "Suggestion chips give a one-tap way into the first reply, which is where people hesitate most. The open input stays available for anything the chips do not cover.",
    trade:
      "Chips can steer answers, so they act as prompts rather than the only path through."
  },
  {
    title: "The report is the deliverable",
    body:
      "Discovery ends in a ranked opportunity summary and a branded PDF instead of a thank-you screen, so the conversation produces something a leader can circulate internally.",
    trade:
      "Two more surfaces to design and keep on brand, but the product now has a takeaway."
  },
  {
    title: "Brand beside the thread, not inside it",
    body:
      "Editorial photography holds the left side while the chat column stays quiet, so Balmer’s atmosphere is present without decorating the messages themselves.",
    trade:
      "Gives up usable width on desktop to protect readability of the conversation."
  }
];

export default function BalmerCaseStudy({ study }) {
  return (
    <article className="study">
      <header className="study-hero">
        <a className="study-back" href="/#work">
          ← Case studies
        </a>
        <p className="about-kicker">
          {study.index} / {study.client} / {study.period}
        </p>
        <h1>Designing and shipping Balmer’s AI discovery assistant</h1>
        <p className="study-lede">
          Balmer Agency helps leaders find where AI can save time, cut cost, and scale operations.
          I designed and built the Business Acceleration Discovery product: a branded guided chat that
          ends in a tailored opportunity report and PDF, so discovery takes minutes instead of a
          questionnaire marathon.
        </p>

        <dl className="study-meta">
          <div>
            <dt>Role</dt>
            <dd>Product design + front-end</dd>
          </div>
          <div>
            <dt>Scope</dt>
            <dd>Chat UX, report UI, PDF export</dd>
          </div>
          <div>
            <dt>Stack</dt>
            <dd>React, Vite, Framer Motion, n8n</dd>
          </div>
          <div>
            <dt>Live</dt>
            <dd>
              {study.live ? (
                <a href={study.live} target="_blank" rel="noreferrer">
                  Open assistant <span aria-hidden="true">[↗]</span>
                </a>
              ) : (
                "Prototype"
              )}
            </dd>
          </div>
        </dl>
      </header>

      <figure className="study-figure study-figure--hero">
        <div className="study-shot study-shot--product">
          <img
            src={balmerChat}
            alt="Balmer AI Business Acceleration Discovery with editorial portraits beside the chat assistant"
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
              Leaders need a fast read on where AI can help, but long forms and generic chatbot chrome
              kill momentum before the first useful answer. Balmer’s brand is sharp and editorial. A
              default messenger UI would have undercut that before the conversation started.
            </p>
          </article>
          <article className="study-snap-cell">
            <p className="study-label">Approach</p>
            <h2>Conversation into a deliverable</h2>
            <p>
              Treat the assistant as the product: welcome with stakes and time, suggestion chips for
              low-friction replies, then a report surface with ranked AI agent recommendations and a
              downloadable PDF. Brand stays present without crowding the thread.
            </p>
          </article>
          <article className="study-snap-cell">
            <p className="study-label">Outcome</p>
            <h2>Live discovery, with a report at the end</h2>
            <p>
              A shipped React prototype on Vercel that looks like Balmer, runs a short guided
              interview against an n8n webhook, and produces an opportunity report leaders can open
              or download. No engagement metrics for this project yet.
            </p>
          </article>
        </div>

        <aside className="study-edge-band">
          <p className="study-label">My role</p>
          <p>
            <strong>I owned the product design and front-end for the discovery experience.</strong>{" "}
            That covered the split brand layout, chat hierarchy, suggestion chips, typing and input
            states, responsive breakpoints, the report page, and PDF export styling. I integrated the
            n8n-backed chat and report flow into the UI, but I was not a main contributor on the
            backend itself. I led the interface end to end so the conversation and the deliverable
            felt like one Balmer product.
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
            <StudyVisualCarousel slides={PRODUCT_SLIDES} label="Balmer product screens" />
          </div>
        </div>

        <div className="study-close">
          <article>
            <p className="study-label">What shipped</p>
            <ul>
              <li>Split brand / chat composition with Framer Motion message states</li>
              <li>Welcome copy with an explicit 5–10 minute time expectation</li>
              <li>Suggestion chips plus free-text input (disabled while the bot types)</li>
              <li>Front-end integration of the n8n chat and report flow</li>
              <li>Report page and branded PDF: summary + ranked AI agents</li>
              <li>Responsive layout across mobile, tablet, and desktop</li>
            </ul>
          </article>
          <article>
            <p className="study-label">Why it mattered</p>
            <p>
              The hard part was not the bubbles. It was making discovery feel short, branded, and
              complete: a conversation that ends in something leaders can keep. Next pass: instrument
              drop-off after the first reply and report opens, so question order and report content
              earn their place with real completion data.
            </p>
          </article>
        </div>
      </section>

      <StudyFooter study={study} liveLabel="Live assistant" />
    </article>
  );
}
