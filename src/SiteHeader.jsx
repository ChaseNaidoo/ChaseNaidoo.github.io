export default function SiteHeader({
  brandHref = "#main-content",
  workHref = "#work",
  aboutHref = "#about",
  contactHref = "#contact",
  resumeHref = "/Cameron-Chase-Naidoo-Resume.pdf"
}) {
  return (
    <header className="site-header">
      <nav className="nav-pill glass-chrome" aria-label="Site navigation">
        <a className="nav-pill-link nav-pill-brand" href={brandHref}>
          Cameron Naidoo
        </a>
        <span className="nav-pill-divider" aria-hidden="true" />
        <a className="nav-pill-link" href={workHref}>
          Case Studies
        </a>
        <a className="nav-pill-link" href={aboutHref}>
          About
        </a>
        <a className="nav-pill-link" href={contactHref}>
          Contact
        </a>
        <a
          className="nav-pill-link nav-pill-resume"
          href={resumeHref}
          target="_blank"
          rel="noreferrer"
        >
          Resume
        </a>
      </nav>
    </header>
  );
}
